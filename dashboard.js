// Dashboard script with error handling
(async function() {
  try {
    const response = await fetch('/api/submissions');
    if (!response.ok) throw new Error("Failed to fetch submissions");
    
    const data = await response.json();
    const tbody = document.querySelector("#submissionTable tbody");

    if(data.length === 0){
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6" style="text-align:center;">No submissions found</td>`;
      tbody.appendChild(tr);
      return;
    }

    data.forEach((item, index)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index+1}</td>
        <td>${item.name || "N/A"}</td>
        <td>${item.phone || "N/A"}</td>
        <td>${item.tenantType || "N/A"}</td>
        <td>${item.timestamp || "N/A"}</td>
        <td><button class="view-btn" data-index="${index}">View</button></td>
      `;
      tbody.appendChild(tr);
    });

    // View Details Button
    document.querySelectorAll(".view-btn").forEach(btn=>{
      btn.addEventListener("click", (e)=>{
        const idx = e.target.getAttribute("data-index");
        const item = data[idx];
        let html = "<h2>Submission Details</h2>";
        for(const key in item){
          html += `<p><strong>${key}:</strong> ${item[key]}</p>`;
        }
        const win = window.open("", "_blank", "width=600,height=700");
        win.document.write(html);
      });
    });

  } catch(err){
    console.error("Error loading submissions:", err);
    const tbody = document.querySelector("#submissionTable tbody");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Could not load submissions. Make sure the server is running.</td></tr>`;
  }
})();