import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { siteConfig } from "@/config/site";
import { currencyFormatter, formatDateTime } from "@/lib/utils";
import type { Order, OrderItem, OrderItemOption } from "@prisma/client";

export type OrderWithRelations = Order & { items: Array<OrderItem & { options: OrderItemOption[] }> };

export async function generateInvoicePdf(order: OrderWithRelations) {
  const doc = new PDFDocument({ margin: 50 });
  const invoiceDir = path.join(process.cwd(), "storage", "invoices");
  if (!fs.existsSync(invoiceDir)) {
    fs.mkdirSync(invoiceDir, { recursive: true });
  }

  const filePath = path.join(invoiceDir, `${order.number}.pdf`);
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  doc.fontSize(18).text(siteConfig.name, { align: "left" });
  doc.moveDown();
  doc.fontSize(12).text(`${siteConfig.address.line1}`);
  doc.text(`${siteConfig.address.city}, ${siteConfig.address.state} ${siteConfig.address.zip}`);
  doc.text(siteConfig.address.phone);
  doc.moveDown();

  doc.fontSize(16).text(`Invoice ${order.number}`);
  doc.moveDown();
  doc.fontSize(12).text(`Date: ${formatDateTime(order.createdAt, { dateStyle: "medium", timeStyle: undefined })}`);
  doc.text(`Event: ${formatDateTime(order.eventAt)}`);
  if (order.fulfillment === "DELIVERY" && order.deliveryLine1) {
    doc.moveDown();
    doc.fontSize(12).text("Deliver to:");
    doc.text(order.deliveryLine1);
    if (order.deliveryLine2) {
      doc.text(order.deliveryLine2);
    }
    doc.text(`${order.deliveryCity}, ${order.deliveryState} ${order.deliveryZip}`);
  }
  doc.moveDown();

  doc.fontSize(12).text("Items:");
  doc.moveDown(0.5);

  order.items.forEach((item) => {
    doc.text(`${item.nameSnapshot} x${item.quantity} — ${currencyFormatter.format(Number(item.total))}`);
    if (item.options.length) {
      item.options.forEach((option) => {
        doc.text(`  • ${option.nameSnapshot} (${currencyFormatter.format(Number(option.priceDelta))})`, {
          indent: 10,
        });
      });
    }
    doc.moveDown(0.5);
  });

  doc.moveDown();
  doc.text(`Subtotal: ${currencyFormatter.format(Number(order.subtotal))}`);
  doc.text(`Tax: ${currencyFormatter.format(Number(order.tax))}`);
  doc.text(`Delivery: ${currencyFormatter.format(Number(order.deliveryFee))}`);
  doc.text(`Discounts: ${currencyFormatter.format(Number(order.discountTotal))}`);
  doc.text(`Tip: ${currencyFormatter.format(Number(order.tip))}`);
  if (order.discountCode) {
    doc.text(`Promo code applied: ${order.discountCode}`);
  }
  doc.fontSize(14).text(`Total: ${currencyFormatter.format(Number(order.total))}`);

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", reject);
  });

  return filePath;
}
