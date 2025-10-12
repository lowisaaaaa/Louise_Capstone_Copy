/* ========= Session & Constants ========= */
const LS = {
  role: "hp_role",
  email: "hp_email",
  barangay: "hp_barangay",
  sector: "hp_sector",
  dataPrefix: "hp_children_"
};

const VACCINES = [
  "BCG (At Birth)","HEPA B (At Birth)","PENTA 1 ( 1 1/2 mos.)","PENTA 2 ( 2 1/2 mos.)","PENTA 3 ( 3 1/2 mos.)",
  "OPV 1  ( 1 1/2 mos.)","OPV 2  ( 2 1/2 mos.)","OPV 3  ( 3 1/2 mos.)",
  "IPV1  ( 3 1/2 mos.)","IPV2  ( 9 mos.)",
  "PCV1  ( 1 1/2 mos.)","PCV2  ( 2 1/2 mos.)","PCV3  ( 3 1/2 mos.)",
  "MCV1 (9 mos.)","MCV2 (12 mos. & 29 days)"
];

const BARANGAYS = [
  "Abiacao","Bagong Tubig","Balagtasin","Balite","Banoyo",
  "Boboy","Bonliw","Calumpang East","Calumpang West",
  "Dulangan","Durungao","Locloc","Luya","Mahabang Parang",
  "Manggahan","Muzon","San Antonio","San Isidro","San Jose",
  "San Martin","Santa Monica","Taliba","Talon","Tejero",
  "Tungal","Poblacion"
];

const SECTORS = ["Sector A", "Sector B", "Sector C"];

function storageKeyFor(b, s) {
  return `${LS.dataPrefix}${b}__${s}`;
}

/* ========= Utilities ========= */
function parseCSV(text) {
  const rows = [];
  let i=0,f="",r=[],q=false;
  while(i<text.length){
    const c=text[i];
    if(c==='"'){ if(q && text[i+1]==='"'){ f+='"'; i++; } else q=!q; }
    else if(c===',' && !q){ r.push(f.trim()); f=""; }
    else if((c==='\n'||c==='\r') && !q){ if(f.length||r.length){ r.push(f.trim()); rows.push(r); f=""; r=[];} if(c==='r' && text[i+1]==='\n')i++; }
    else f+=c; i++;
  }
  if(f.length||r.length){ r.push(f.trim()); rows.push(r);}
  return rows.filter(r=>r.length && r.some(x=>x!==""));
}

function toCSV(rows){
  return rows.map(r=>r.map(v=>{
    const s=v==null?"":String(v);
    return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  }).join(',')).join('\n');
}

function download(filename,mime,content){
  const blob=new Blob([content],{type:mime});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename;a.click();
  URL.revokeObjectURL(url);
}

function tableToXls(filename, tableElem) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${tableElem.outerHTML}</body></html>`;
  download(filename, "application/vnd.ms-excel", html);
}

/* ========= Login Handling ========= */
function loginHandler() {
  // Hardcoded MHO user
  const mhoUser = { "mho@gmail.com": { password: "password", role: "MHO", redirect: "mho_dashboard.html" } };

  // Dynamically loaded BNS/BHW/MHO users
  const bhwBnsProfiles = JSON.parse(localStorage.getItem("bhwBnsProfiles") || "[]");
  const dynamicUsers = {};
  bhwBnsProfiles.forEach(profile => {
    const username = profile.email.split('@')[0]; // Get username part
    const userDetails = {
      password: profile.password || "password",
      role: profile.role,
      barangay: profile.barangay,
      sector: profile.sector,
      redirect: profile.role === "MHO" ? "mho_dashboard.html" : (profile.role === "BNS" ? "bns_dashboard.html" : "bhw_dashboard.html"),
      email: profile.email // Store the full email in userDetails
    };
    dynamicUsers[profile.email] = userDetails; // Store by full email
    dynamicUsers[username] = userDetails;      // Store by username
  });

  // Combine all users
  const allUsers = { ...mhoUser, ...dynamicUsers };

  document.getElementById("loginForm")?.addEventListener("submit", function(e) {
    e.preventDefault();
    let emailInput = document.getElementById("email").value.toLowerCase().trim();
    const password = document.getElementById("password").value;

    // Determine the lookup key based on whether the input contains '@'
    let lookupKey = emailInput;
    if (!emailInput.includes('@')) {
      // If no '@' is present, assume it's a BNS/BHW username
      lookupKey = emailInput;
    }

    const user = allUsers[lookupKey];
    if (user && user.password === password) {
      localStorage.setItem(LS.role, user.role);
      // For BNS/BHW, store the full email in LS.email, even if they logged in with username
      localStorage.setItem(LS.email, user.email); 
      if(user.barangay) localStorage.setItem(LS.barangay,user.barangay);
      if(user.sector) localStorage.setItem(LS.sector,user.sector);
      
      // Store the logged-in user's full profile for BNS/BHW dashboards
      if (user.role === "BNS" || user.role === "BHW") {
        // Find the actual profile using the full email, which is stored in user.email
        const loggedInProfile = bhwBnsProfiles.find(p => p.email === user.email);
        localStorage.setItem("loggedInUser", JSON.stringify(loggedInProfile));
      }

      window.location.href = user.redirect;
    } else {
      document.getElementById("error").style.display="block";
    }
  });
}

/* ========= Table Rendering ========= */
function renderTable(tbody, data) {
  tbody.innerHTML = "";
  data.forEach((row,index)=>{
    const tr=document.createElement("tr");
    tr.innerHTML = `
      <td>${row["Name of Children"]||""}</td>
      <td>${row["Age in Months"]||""}</td>
      <td>${row["Date of Birth"]||""}</td>
      <td>${row["Name of Parent"]||""}</td>
      ${VACCINES.map(v=>`<td><span class="badge ${row[v]?"vaccinated":"not-vaccinated"}">${row[v]||"Not Vaccinated"}</span></td>`).join("")}
      <td>
        <button class="action-btn edit-btn" onclick="editRow(this,${index})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteRow(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editRow(button,index){
  const tr = button.closest("tr");
  const isEditing = button.innerText==="Save";

  if(isEditing){
    const cells=tr.querySelectorAll("td");
    const updated = {
      "Name of Children": cells[0].innerText.trim(),
      "Age in Months": cells[1].innerText.trim(),
      "Date of Birth": cells[2].innerText.trim(),
      "Name of Parent": cells[3].innerText.trim(),
      "Barangay": localStorage.getItem(LS.barangay),
      "Sector": localStorage.getItem(LS.sector)
    };
    let col=4;
    VACCINES.forEach(v=>{ updated[v]=cells[col].innerText.trim(); col++; });
    childrenData[index]=updated;
    localStorage.setItem(storageKeyFor(localStorage.getItem(LS.barangay),localStorage.getItem(LS.sector)),JSON.stringify(childrenData));
    renderTable(document.querySelector("#childrenTable tbody"), childrenData);
  } else {
    tr.querySelectorAll("td").forEach((c,i)=>{ if(i<4) c.contentEditable=true; });
    button.innerText="Save";
  }
}

function deleteRow(index){
  childrenData.splice(index,1);
  localStorage.setItem(storageKeyFor(localStorage.getItem(LS.barangay),localStorage.getItem(LS.sector)),JSON.stringify(childrenData));
  renderTable(document.querySelector("#childrenTable tbody"), childrenData);
}

/* ========= Aggregation ========= */
function aggregateData() {
  const summary={ totalChildren: childrenData.length, barangayCounts:{}, vaccineStatus:{} };
  VACCINES.forEach(v=>summary.vaccineStatus[v]={vaccinated:0,notVaccinated:0});
  childrenData.forEach(c=>{
    const brgy=c["Barangay"]||"Unknown";
    summary.barangayCounts[brgy]=(summary.barangayCounts[brgy]||0)+1;
    VACCINES.forEach(v=>{ summary.vaccineStatus[v][c[v]?"vaccinated":"notVaccinated"]++; });
  });
  return summary;
}

function renderSummary() {
  const s=aggregateData();
  document.getElementById("totalChildren").textContent=s.totalChildren;
  const brgyDiv=document.getElementById("barangaySummary"); brgyDiv.innerHTML="";
  Object.entries(s.barangayCounts).forEach(([b,c])=>{ const p=document.createElement("p"); p.textContent=`${b}: ${c}`; brgyDiv.appendChild(p); });
  const vacDiv=document.getElementById("vaccineSummary"); vacDiv.innerHTML="";
  Object.entries(s.vaccineStatus).forEach(([v,c])=>{ const p=document.createElement("p"); p.textContent=`${v} → Vaccinated: ${c.vaccinated}, Not Vaccinated: ${c.notVaccinated}`; vacDiv.appendChild(p); });
}

/* ========= Logout Function ========= */
function logout() {
  localStorage.removeItem(LS.role);
  localStorage.removeItem(LS.email);
  localStorage.removeItem(LS.barangay);
  localStorage.removeItem(LS.sector);
  localStorage.removeItem("loggedInUser");
  window.location.href = 'index.html';
}

/* ========= Page Bootstrap ========= */
document.addEventListener("DOMContentLoaded",()=>{
  loginHandler();

  const page = location.pathname.split("/").pop();
  if(page==="bns_dashboard.html"||page==="bhw_dashboard.html"){
    const barangay = localStorage.getItem(LS.barangay)||"";
    const sector = localStorage.getItem(LS.sector)||"Sector A";
    const key = storageKeyFor(barangay,sector);
    window.childrenData = JSON.parse(localStorage.getItem(key)||"[]");
    renderTable(document.querySelector("#childrenTable tbody"), childrenData);
    renderSummary();

    // import CSV
    document.getElementById("importBtn")?.addEventListener("click", async ()=>{
      const file = document.getElementById("fileInput").files[0];
      if(!file){ alert("Select a CSV file first."); return; }
      const text=await file.text();
      const rows=parseCSV(text);
      if (rows.length < 1) { alert("Invalid CSV file."); return; }
      const hdr=rows[0].map(h=>h.trim().toLowerCase());
      const idx = {
        child: hdr.indexOf("name of children") >= 0 ? hdr.indexOf("name of children") : hdr.indexOf("name"),
        age: hdr.indexOf("age in months") >= 0 ? hdr.indexOf("age in months") : hdr.indexOf("age"),
        dob: hdr.indexOf("date of birth") >= 0 ? hdr.indexOf("date of birth") : hdr.indexOf("dob"),
        parent: hdr.indexOf("name of parent") >= 0 ? hdr.indexOf("name of parent") : hdr.indexOf("parent"),
        barangay: hdr.indexOf("barangay"),
        sector: hdr.indexOf("sector"),
      };
      if(Object.values(idx).some(v=>v<0)){ alert("Missing basic columns."); return; }
      // Flexible vaccine mapping
      const vaccineIndices = {};
      VACCINES.forEach(v => {
        let lowerV = v.toLowerCase();
        // Try exact full name
        let i = hdr.indexOf(lowerV);
        if (i < 0) {
          // Try short name by removing parentheses and after
          const short = lowerV.replace(/\s*\(.*$/, '');
          i = hdr.indexOf(short);
        }
        if (i < 0) {
          // Try even shorter, e.g., 'penta 1'
          const parts = short.split(' ');
          if (parts.length >= 2) {
            i = hdr.indexOf(parts[0] + ' ' + parts[1]);
          }
        }
        vaccineIndices[v] = i;
      });
      const list = [];
      for(let i=1; i<rows.length; i++){
        const r = rows[i];
        if(!r || r.length === 0) continue;
        // Pad r if shorter than expected
        while (r.length < hdr.length) r.push('');
        const child = {
          "Name of Children": r[idx.child] || "",
          "Age in Months": r[idx.age] || "",
          "Date of Birth": r[idx.dob] || "",
          "Name of Parent": r[idx.parent] || "",
          "Barangay": r[idx.barangay] || barangay,
          "Sector": r[idx.sector] || sector
        };
        VACCINES.forEach(v => {
          const vacIdx = vaccineIndices[v];
          child[v] = (vacIdx >= 0 && vacIdx < r.length) ? r[vacIdx] || "" : "";
        });
        list.push(child);
      }
      if (list.length === 0) { alert("No data rows found in CSV."); return; }
      childrenData=list;
      localStorage.setItem(key,JSON.stringify(childrenData));
      renderTable(document.querySelector("#childrenTable tbody"), childrenData);
      renderSummary();
      alert("Imported successfully.");
    });

    // export CSV
    document.getElementById("downloadCsv")?.addEventListener("click",()=>{
      const rows=[["Name of Children","Age in Months","Date of Birth","Name of Parent","Barangay","Sector",...VACCINES]];
      childrenData.forEach(r=>rows.push([r["Name of Children"],r["Age in Months"],r["Date of Birth"],r["Name of Parent"],r.Barangay,r.Sector,...VACCINES.map(v=>r[v]||"")]));
      download(`${barangay}_${sector}.csv`,"text/csv",toCSV(rows));
    });

    // export XLS
    document.getElementById("downloadXls")?.addEventListener("click",()=>{
      tableToXls(`${barangay}_${sector}.xls`,document.getElementById("childrenTable"));
    });
  }
});
