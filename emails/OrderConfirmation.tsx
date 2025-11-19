export type OrderLine = {
  name: string;
  color?: string;
  quantity: number;
  price: string;
};

export type OrderConfirmationProps = {
  customerName: string;
  orderId: string;
  total: string;
  subtotal: string;
  shipping: string;
  lines: OrderLine[];
  shippingAddress: {
    street: string;
    city: string;
    phone: string;
    email?: string;
  };
};

const containerStyles = {
  fontFamily:
    "'Helvetica Neue', Helvetica, Arial, sans-serif",
  backgroundColor: "#f4f4f5",
  padding: "32px 16px",
};

const cardStyles = {
  maxWidth: "640px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e4e4e7",
  padding: "32px",
};

const dividerStyles = {
  borderTop: "1px solid #e4e4e7",
  margin: "24px 0",
};

export function OrderConfirmation({
  customerName,
  orderId,
  total,
  subtotal,
  shipping,
  lines,
  shippingAddress,
}: OrderConfirmationProps) {
  return (
    <div style={containerStyles}>
      <div style={cardStyles}>
        <h1
          style={{
            fontSize: "24px",
            marginBottom: "8px",
            color: "#11181c",
          }}
        >
          Thank you, {customerName}!
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            color: "#3f3f46",
            fontSize: "15px",
            lineHeight: "1.5",
          }}
        >
          Your order is being processed. Below is a summary
          for your records. If anything looks off, just reply
          to this email and we&apos;ll get it sorted fast.
        </p>

        <p
          style={{
            margin: 0,
            fontSize: "13px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#71717a",
          }}
        >
          Order
        </p>
        <p
          style={{
            margin: "4px 0 20px",
            fontSize: "16px",
            fontWeight: 600,
            color: "#18181b",
          }}
        >
          #{orderId}
        </p>

        <div style={{ marginBottom: "16px" }}>
          {lines.map((line) => (
            <div
              key={`${line.name}-${line.color ?? "default"}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "12px",
                fontSize: "14px",
                color: "#18181b",
              }}
            >
              <div>
                <strong>{line.name}</strong>
                <div style={{ color: "#71717a" }}>
                  Qty {line.quantity}
                  {line.color ? ` • ${line.color}` : ""}
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>{" "}{line.price}</div>
            </div>
          ))}
        </div>

        <div style={dividerStyles} />

        <div style={{ fontSize: "14px", color: "#18181b" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <span>Subtotal{" "}</span>
            <strong>{subtotal}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <span>Shipping{" "}</span>
            <strong>{shipping}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "16px",
              marginTop: "12px",
            }}
          >
            <span>Total{" "}</span>
            <strong>{total}</strong>
          </div>
        </div>

        <div style={dividerStyles} />

        <div>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#71717a",
            }}
          >
            Shipping to
          </p>
          <p
            style={{
              margin: "4px 0",
              fontSize: "15px",
              color: "#18181b",
            }}
          >
            {shippingAddress.street}
            <br />
            {shippingAddress.city}
            <br />
            {shippingAddress.phone}
            {shippingAddress.email ? (
              <>
                <br />
                {shippingAddress.email}
              </>
            ) : null}
          </p>
        </div>

        <p
          style={{
            margin: "32px 0 0",
            fontSize: "13px",
            color: "#71717a",
          }}
        >
          We&apos;ll reach out once the courier picks up your
          package. Until then, stay under control. ✊
        </p>
      </div>
    </div>
  );
}

export default OrderConfirmation;
