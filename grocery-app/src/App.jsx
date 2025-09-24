import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import "./App.css";

function App() {
  const [data, setData] = useState({});
  const [quantities, setQuantities] = useState({});
  const [popupImage, setPopupImage] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null); // only one group expanded
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [confirmData, setConfirmData] = useState([]);

  useEffect(() => {
    fetch("/groceries.json")
      .then((res) => res.json())
      .then((jsonData) => {
        setData(jsonData);
        const initialQuantities = {};
        Object.entries(jsonData).forEach(([group, items]) => {
          items.forEach((_, idx) => {
            initialQuantities[`${group}-${idx}`] = 0;
          });
        });
        setQuantities(initialQuantities);
      });
  }, []);

  const total = Object.entries(data).reduce((groupAcc, [group, items]) => {
    return (
      groupAcc +
      items.reduce((itemAcc, item, idx) => {
        const key = `${group}-${idx}`;
        const qty = quantities[key] || 0;
        const price = parseFloat(item["Final Rate"]) || 0;
        return itemAcc + price * qty;
      }, 0)
    );
  }, 0);

  const handleQuantityChange = (group, index, value) => {
    const key = `${group}-${index}`;
    setQuantities((prev) => ({
      ...prev,
      [key]: value === "" ? 0 : parseInt(value) || 0,
    }));
  };

  const toggleGroup = (group) => {
    setExpandedGroup(prev => (prev === group ? null : group)); // only one open
  };

  const handleCheckout = () => {
    const selectedItems = [];

    Object.entries(data).forEach(([group, items]) => {
      items.forEach((item, idx) => {
        const key = `${group}-${idx}`;
        const qty = quantities[key];
        if (qty > 0) {
          selectedItems.push({
            ...item,
            quantity: qty,
          });
        }
      });
    });

    if (selectedItems.length === 0) {
      alert("Please select at least one product!");
      return;
    }

    setConfirmData(selectedItems);
    setConfirmPopup(true);
  };

  const generatePDF = (items, fileName = "Final_List") => {
    const doc = new jsPDF();
    let y = 10;
    const marginLeft = 10;
    const lineHeight = 8;
    const columnWidths = { code: 40, name: 70, qty: 30, price: 40 };

    doc.setFontSize(18);
    doc.setFont("times", "bold");
    doc.text(`${fileName}_Check List`, marginLeft, y);
    y += 15;

    const totalAmount = items.reduce(
      (acc, item) =>
        acc + (parseInt(item.quantity) || 0) * (parseFloat(item["Final Rate"]) || 0),
      0
    );
    doc.setFontSize(14);
    doc.setFont("times", "normal");
    doc.text(`Total: Rs. ${totalAmount}`, marginLeft, y);
    y += 10 + 5;

    // Table headers
    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.text("Product Code", marginLeft, y);
    doc.text("Product Name", marginLeft + columnWidths.code, y);
    doc.text("Qty", marginLeft + columnWidths.code + columnWidths.name, y);
    doc.text(
      "Total Price",
      marginLeft + columnWidths.code + columnWidths.name + columnWidths.qty,
      y
    );
    y += lineHeight;

    doc.setFont("times", "normal");
    items.forEach((item) => {
      const qty = parseInt(item.quantity) || 0;
      const rate = parseFloat(item["Final Rate"]) || 0;

      doc.text(item["Product Code"] || "", marginLeft, y);
      doc.text(item["Product Name"] || "", marginLeft + columnWidths.code, y);
      doc.text(`${qty}`, marginLeft + columnWidths.code + columnWidths.name, y);
      doc.text(
        `Rs. ${qty * rate}`,
        marginLeft + columnWidths.code + columnWidths.name + columnWidths.qty,
        y
      );

      y += lineHeight;

      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save(`${fileName}.pdf`);
  };

  const openPopup = (imgSrc) => setPopupImage(imgSrc);
  const closePopup = () => setPopupImage(null);
  const handlePopupClick = (e) => {
    if (e.target.classList.contains("popup-overlay")) closePopup();
  };

  return (
    <div className="App">
      <header className="app-header">
        <img src="/download.jfif" alt="Diwali Crackers" className="header-image" />
        <div className="header-text">
          <h1>🎉 Diwali Sale is Open! 🎉</h1>
          <p>Wishing You a Happy & Prosperous Diwali ✨</p>
          {/* <p className="contact-number">
            📞 For Queries & Bulk Orders: <strong>+91 9677967124</strong>
          </p> */}
        </div>
      </header>

      <div className="total">
        <strong>Total Amount:</strong> Rs. {total.toFixed(2)}
      </div>

      {Object.entries(data).map(([group, items]) => (
        <div key={group} className="group-section">
          <div className="group-title" onClick={() => toggleGroup(group)}>
            <span>{group}</span>
            <span>{expandedGroup === group ? "-" : "+"}</span>
          </div>

          {expandedGroup === group && (
            <div className="card-grid">
              {items.map((item, idx) => {
                const key = `${group}-${idx}`;
                return (
                  <div className="product-card" key={key}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item["Product Name"]}
                        className="thumbnail"
                        onClick={() => openPopup(item.image)}
                      />
                    ) : (
                      <div className="thumbnail" style={{ background: "#ddd" }}>
                        No Image
                      </div>
                    )}

                    <div className="product-info">
                      <h3>{item["Product Name"]}</h3>
                      <div className="rate-container">
                        <span className="original-rate">
                          Rs. {item["Rate / Qty"]}
                        </span>
                        <span className="final-rate">Rs. {item["Final Rate"]}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={quantities[key] === 0 ? "" : quantities[key]}
                        onChange={(e) =>
                          handleQuantityChange(group, idx, e.target.value)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <button className="checkout-btn" onClick={handleCheckout}>
        Checkout & Review
      </button>

      {/* Image Popup */}
      {popupImage && (
        <div
          className="popup-overlay"
          onClick={handlePopupClick}
          role="dialog"
          aria-modal="true"
        >
          <div className="popup-content">
            <button className="popup-close" onClick={closePopup}>
              &times;
            </button>
            <img src={popupImage} alt="Product Large View" />
          </div>
        </div>
      )}

      {/* Confirmation Popup */}
      {confirmPopup && (
        <div className="popup-overlay" onClick={() => setConfirmPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Your Selection</h2>
            <div className="confirm-list">
              {confirmData.map((item, idx) => (
                <div key={idx} className="confirm-item">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item["Product Name"]}
                      className="confirm-thumb"
                    />
                  )}
                  <span>{item["Product Name"]}</span>
                  <span>Qty: {item.quantity}</span>
                  <span>Rs. {item.quantity * item["Final Rate"]}</span>
                </div>
              ))}
            </div>
            <button
              className="checkout-btn"
              onClick={() => {
                setConfirmPopup(false);
                const fileName = prompt("Enter file name for your PDF:", "Final_List");
                if (!fileName) return; // cancel if empty
                generatePDF(confirmData, fileName);
              }}
            >
              Confirm & Save PDF
              <p style={{ marginTop: "10px", fontStyle: "italic", color: "#333" }}>
                Download your PDF and share it easily via WhatsApp! 📲
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
