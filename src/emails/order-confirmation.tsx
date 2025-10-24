import { siteConfig } from "@/config/site";
import { currencyFormatter, formatDateTime } from "@/lib/utils";
import type { OrderWithRelations } from "@/lib/invoice";

export function renderOrderConfirmationEmail(order: OrderWithRelations) {
  const items = order.items
    .map((item) => {
      const options = item.options
        .map((option) => `<li>${option.nameSnapshot} (${currencyFormatter.format(Number(option.priceDelta))})</li>`)
        .join("");

      return `
        <li>
          <strong>${item.nameSnapshot}</strong> x${item.quantity} — ${currencyFormatter.format(Number(item.total))}
          ${options ? `<ul>${options}</ul>` : ""}
        </li>
      `;
    })
    .join("");

  const deliveryDetails =
    order.fulfillment === "DELIVERY" && order.deliveryLine1
      ? `
    <p><strong>Deliver to:</strong><br />
    ${order.deliveryLine1}<br />
    ${order.deliveryLine2 ? `${order.deliveryLine2}<br />` : ""}
    ${order.deliveryCity}, ${order.deliveryState} ${order.deliveryZip}</p>
  `
      : `
    <p><strong>Pickup:</strong> We will have your order ready at ${siteConfig.address.line1}, ${siteConfig.address.city}, ${siteConfig.address.state} ${siteConfig.address.zip}.</p>
  `;

  return `
    <div style="font-family: Arial, sans-serif; color: #111827;">
      <h1>Thanks for your order!</h1>
      <p>Your event is scheduled for ${formatDateTime(order.eventAt)}.</p>
      ${deliveryDetails}
      <h2>Order summary</h2>
      <ul>${items}</ul>
      <p>Subtotal: ${currencyFormatter.format(Number(order.subtotal))}</p>
      <p>Tax: ${currencyFormatter.format(Number(order.tax))}</p>
      <p>Delivery: ${currencyFormatter.format(Number(order.deliveryFee))}</p>
      <p>Tip: ${currencyFormatter.format(Number(order.tip))}</p>
      ${order.discountCode ? `<p>Promo code applied: ${order.discountCode}</p>` : ""}
      <p><strong>Total: ${currencyFormatter.format(Number(order.total))}</strong></p>
      <p>If you have any questions, reply to this email or call ${siteConfig.address.phone}.</p>
    </div>
  `;
}
