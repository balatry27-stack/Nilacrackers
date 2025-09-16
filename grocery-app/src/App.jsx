import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import './App.css';

function App() {
  const [data, setData] = useState({});
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    fetch('/groceries.json')
      .then(res => res.json())
      .then(jsonData => {
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
    return groupAcc + items.reduce((itemAcc, item, idx) => {
      const key = `${group}-${idx}`;
      const qty = quantities[key] || 0;
      const price = parseFloat(item["Final Rate"]) || 0;
      return itemAcc + price * qty;
    }, 0);
  }, 0);

  const handleQuantityChange = (group, index, value) => {
    const key = `${group}-${index}`;
    setQuantities(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0,
    }));
  };

  const handleCheckout = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(18);
    doc.text('Grocery Receipt', 10, y);
    y += 15;

    Object.entries(data).forEach(([group, items]) => {
      doc.setFontSize(14);
      doc.text(`Group: ${group}`, 10, y);
      y += 10;

      items.forEach((item, idx) => {
        const key = `${group}-${idx}`;
        const qty = quantities[key];
        if (qty > 0) {
          const price = parseFloat(item["Final Rate"]) || 0;
          const line = `${item["Product Code"]} - ${item["Product Name"]} x ${qty} = ₹${(price * qty).toFixed(2)}`;
          doc.setFontSize(12);
          doc.text(line, 10, y);
          y += 8;
          if (y > 280) {
            doc.addPage();
            y = 10;
          }
        }
      });

      y += 10;
    });

    doc.setFontSize(16);
    doc.text(`Total: ₹${total.toFixed(2)}`, 10, y);
    doc.save('receipt.pdf');
  };

  return (
    <div className="App">
      <header className="app-header">
        <img
          src="/download.jfif"
          alt="Diwali Crackers"
          className="header-image"
          style={{ width: '100%' }}
        />
        <div className="header-text">
          <h1>🎉 Diwali Sale is Open! 🎉</h1>
          <p>Wishing You a Happy & Prosperous Diwali ✨</p>
        </div>
      </header>
      <div className="total">
        <strong>Total Amount:</strong> ₹{total.toFixed(2)}
      </div>

      {Object.entries(data).map(([group, items]) => (
        <div key={group} className="group-section">
          <div className="group-title">
            <h2>{group}</h2>
            <p className="subtitle">Premium Crackers & Snacks</p>
          </div>

          <form>
            <div className="table-header">
              <div className="col code">Product Code</div>
              <div className="col name">Product Name</div>
              <div className="col rate">Rate / Qty (₹)</div>
              <div className="col discount">Discount (₹)</div>
              <div className="col final-price">Final Price (₹)</div>
              <div className="col qty">Quantity</div>
            </div>

            {items.map((item, index) => {
              const key = `${group}-${index}`;
              return (
                <div className="table-row" key={key}>
                  <div className="col code">{item["Product Code"]}</div>
                  <div className="col name">{item["Product Name"]}</div>
                  <div className="col rate">{parseFloat(item["Rate / Qty"]).toFixed(2)}</div>
                  <div className="col discount">{parseFloat(item["Discount"]).toFixed(2)}</div>
                  <div className="col final-price">{parseFloat(item["Final Rate"]).toFixed(2)}</div>
                  <div className="col qty">
                    <input
                      type="number"
                      min="0"
                      value={quantities[key] || 0}
                      onChange={e => handleQuantityChange(group, index, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </form>
        </div>
      ))}

      <button onClick={handleCheckout}>Checkout & Save PDF</button>
    </div>
  );
}

export default App;
