import React, { useEffect, useState } from 'react';
import { toWords } from 'number-to-words';
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
        // Initialize quantities with 0 for each item
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
      [key]: value === '' ? 0 : parseInt(value) || 0,
    }));
  };

 const handleCheckout = () => {
   // Prompt for the user's name
    const name = prompt("Please enter your name:");

    // If the user doesn't provide a name, return
    if (!name) {
      alert("You must enter your name to proceed!");
      return;
    }

    
  const doc = new jsPDF();
  let y = 10;
  const marginLeft = 10;
  const lineHeight = 8;
  const columnWidths = {
    code: 40, // Product Code column width
    name: 70, // Product Name column width
    qty: 30,  // Quantity column width
    price: 40 // Total Price column width
  };

  // Set the title of the document and bold it
  doc.setFontSize(18);
  doc.setFont('times', 'bold');  // Use `times` font to ensure Rs.  symbol works
  doc.text(`${name}_Check List`, marginLeft, y); // Prepend user's name
  y += 15;

  // Display the total amount in a smaller size
  doc.setFontSize(14);
  doc.setFont('times', 'normal');  // Use `times` font here too
  doc.text(`Total: Rs. ${total}`, marginLeft, y); // Display total amount
  y += 10;

  // Add a little space between total and product list
  y += 5;

  // Table Header
  doc.setFontSize(12);
  doc.setFont('times', 'bold'); // Use `times` font for bold headers
  doc.text('Product Code', marginLeft, y);
  doc.text('Product Name', marginLeft + columnWidths.code, y);
  doc.text('Quantity', marginLeft + columnWidths.code + columnWidths.name, y);
  doc.text('Total Price', marginLeft + columnWidths.code + columnWidths.name + columnWidths.qty, y);
  y += lineHeight;

  // Loop through each group and item, but only display selected products
  Object.entries(data).forEach(([group, items]) => {
    items.forEach((item, idx) => {
      const key = `${group}-${idx}`;
      const qty = quantities[key];
      if (qty > 0) {
        const price = parseInt(item["Final Rate"]) || 0;
        const formattedPrice = price; // Ensures two decimal places
        const totalCost = (price * qty); // Total cost for that item

        // Print the product row
        doc.setFontSize(12);
        doc.setFont('times', 'normal'); // Use `times` font here too
        
        // Product Code
        doc.text(item["Product Code"], marginLeft, y);
        // Product Name
        doc.text(item["Product Name"], marginLeft + columnWidths.code, y);
        
        // Set Quantity bold
        doc.setFont('times', 'bold'); // Use `times` font for bold quantity
        doc.text(`${qty}`, marginLeft + columnWidths.code + columnWidths.name, y);
        
        // Set Price normal and use Rs.  symbol (now it should render correctly with `times` font)
        doc.setFont('times', 'normal'); // Switch back to normal font for the price
        doc.text(`Rs. ${totalCost}`, marginLeft + columnWidths.code + columnWidths.name + columnWidths.qty, y);
        
        y += lineHeight;

        // Add a page if needed
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
      }
    });
  });

  // Finalize and save the PDF
  doc.save('Final List.pdf');
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
        <strong>Total Amount:</strong> Rs. {total.toFixed(2)}
      </div>

      {Object.entries(data).map(([group, items]) => (
        <div key={group} className="group-section">
          <div className="group-title">
            <h2>{group}</h2>
          </div>

          <form>
            <div className="table-header">
              <div className="col code">Product Code</div>
              <div className="col name">Product Name</div>
              <div className="col rate">Rate / Qty (Rs. )</div>
              <div className="col discount">Discount (Rs. )</div>
              <div className="col final-price">Final Price (Rs. )</div>
              <div className="col qty">Quantity</div>
            </div>

            {items.map((item, index) => {
              const key = `${group}-${index}`;
              return (
                <div className="table-row" key={key}>
                  <div className="col code">{item["Product Code"]}</div>
                  <div className="col name">{item["Product Name"]}</div>
                  <div className="col rate">{parseInt(item["Rate / Qty"])}</div>
                  <div className="col discount">{parseInt(item["Discount"])}</div>
                  <div className="col final-price">{parseInt(item["Final Rate"])}</div>
                  <div className="col qty">
                    <input
                      type="number"
                      min="0"
                      value={quantities[key] === 0 ? '' : quantities[key]}  // Show empty if 0
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
