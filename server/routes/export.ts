import { Router } from "express";
import { db } from "../db";
import { claims } from "@shared/schema";
import { eq } from "drizzle-orm";
import { authenticateRequest } from "../auth";
import { pgTable, serial, integer, varchar, text, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import PDFDocument from "pdfkit";

const inspectionSessions = pgTable("inspection_sessions", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

const inspectionRooms = pgTable("inspection_rooms", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  roomType: varchar("room_type", { length: 50 }),
  dimensions: jsonb("dimensions"),
  damageCount: integer("damage_count").default(0),
  photoCount: integer("photo_count").default(0),
});

const damageObservations = pgTable("damage_observations", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  roomId: integer("room_id").notNull(),
  description: text("description").notNull(),
  damageType: varchar("damage_type", { length: 50 }),
  severity: varchar("severity", { length: 20 }),
  location: text("location"),
});

const lineItems = pgTable("line_items", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  roomId: integer("room_id"),
  category: varchar("category", { length: 50 }).notNull(),
  action: varchar("action", { length: 30 }),
  description: text("description").notNull(),
  quantity: real("quantity"),
  unit: varchar("unit", { length: 20 }),
  unitPrice: real("unit_price"),
  totalPrice: real("total_price"),
});

export function exportRouter() {
  const router = Router();

  router.get("/claims/:claimId/export/pdf", authenticateRequest, async (req, res) => {
    try {
      const claimId = parseInt(String(req.params.claimId));
      const [claim] = await db.select().from(claims).where(eq(claims.id, claimId)).limit(1);
      if (!claim) return res.status(404).json({ message: "Claim not found" });

      const [session] = await db.select().from(inspectionSessions)
        .where(eq(inspectionSessions.claimId, claimId)).limit(1);

      const rooms = session ? await db.select().from(inspectionRooms).where(eq(inspectionRooms.sessionId, session.id)) : [];
      const damages = session ? await db.select().from(damageObservations).where(eq(damageObservations.sessionId, session.id)) : [];
      const items = session ? await db.select().from(lineItems).where(eq(lineItems.sessionId, session.id)) : [];

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="claim-${claim.claimNumber}-report.pdf"`);
      doc.pipe(res);

      // Title
      doc.fontSize(20).font("Helvetica-Bold").text("Claims IQ Inspection Report", { align: "center" });
      doc.moveDown();

      // Claim info
      doc.fontSize(14).font("Helvetica-Bold").text("Claim Information");
      doc.fontSize(11).font("Helvetica");
      doc.text(`Claim #: ${claim.claimNumber}`);
      doc.text(`Insured: ${claim.insuredName || "N/A"}`);
      doc.text(`Property: ${[claim.propertyAddress, claim.city, claim.state, claim.zip].filter(Boolean).join(", ")}`);
      doc.text(`Date of Loss: ${claim.dateOfLoss || "N/A"}`);
      doc.text(`Peril: ${claim.perilType || "N/A"}`);
      doc.text(`Status: ${claim.status}`);
      doc.moveDown();

      // Rooms
      if (rooms.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("Inspected Rooms");
        doc.fontSize(11).font("Helvetica");
        for (const room of rooms) {
          const dims = room.dimensions as any;
          doc.text(`• ${room.name} (${room.roomType || "general"}) — ${dims?.length || "?"}' x ${dims?.width || "?"}' — ${room.damageCount || 0} damages, ${room.photoCount || 0} photos`);
        }
        doc.moveDown();
      }

      // Damages
      if (damages.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("Damage Observations");
        doc.fontSize(11).font("Helvetica");
        for (const dmg of damages) {
          const room = rooms.find((r) => r.id === dmg.roomId);
          doc.text(`• [${room?.name || "?"}] ${dmg.description} — ${dmg.damageType}, ${dmg.severity}${dmg.location ? `, at ${dmg.location}` : ""}`);
        }
        doc.moveDown();
      }

      // Line items / scope
      if (items.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("Scope of Work / Estimate");
        doc.fontSize(11).font("Helvetica");

        const trades = [...new Set(items.map((i) => i.category))];
        for (const trade of trades) {
          const tradeItems = items.filter((i) => i.category === trade);
          const tradeTotal = tradeItems.reduce((s, i) => s + (i.totalPrice || 0), 0);
          doc.font("Helvetica-Bold").text(`${trade} — $${tradeTotal.toFixed(2)}`);
          doc.font("Helvetica");
          for (const li of tradeItems) {
            doc.text(`  ${li.action || ""} ${li.description} — ${li.quantity || 0} ${li.unit || ""} @ $${(li.unitPrice || 0).toFixed(2)} = $${(li.totalPrice || 0).toFixed(2)}`);
          }
        }
        doc.moveDown();

        const total = items.reduce((s, i) => s + (i.totalPrice || 0), 0);
        const qualifiesOP = trades.length >= 3;
        doc.font("Helvetica-Bold").text(`Subtotal: $${total.toFixed(2)}`);
        if (qualifiesOP) {
          const op = total * 0.2;
          doc.text(`O&P (10% + 10%): $${op.toFixed(2)}`);
          doc.text(`Grand Total: $${(total + op).toFixed(2)}`);
        } else {
          doc.text(`Grand Total: $${total.toFixed(2)}`);
        }
      }

      doc.end();
    } catch (err) {
      console.error("export pdf error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return router;
}
