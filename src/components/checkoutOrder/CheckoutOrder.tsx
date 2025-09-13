import { useState } from "react";

const CheckoutOrder = () => {
  const [open, setOpen] = useState(true);

  const style = {
    display: open ? "flex" : "none",
    backgroundColor: "lightgray",
    width: "100vw",
    height: "100vh",
    position: "fixed" as const,
    top: 0,
    left: 0,
  };
  return (
    <>
      <button onClick={() => setOpen(!open)}>Toggle Checkout</button>{" "}
      <div style={style}>
        CheckoutOrder{" "}
        <button onClick={() => setOpen(!open)}>Toggle Checkout</button>{" "}
      </div>
    </>
  );
};

export default CheckoutOrder;
