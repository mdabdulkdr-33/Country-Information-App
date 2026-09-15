const searchInput = document.getElementById('searchInput');
const resultArea = document.getElementById('resultArea');
const suggestions = document.getElementById('suggestions');
const favCount = document.getElementById('favCount');
const timeEl = document.getElementById('time');
let favorites = JSON.parse(localStorage.getItem('favs') || '[]');
let currentCountry = null;

const localCountries = {
    india: { name: { common: "India" }, capital: ["New Delhi"], population: 1428600000, region: "Asia", subregion: "Southern Asia", currencies: { INR: { name: "Indian Rupee" } }, area: 3287590, languages: { hin: "Hindi", eng: "English" }, timezones: ["UTC+05:30"], borders: ["BGD", "BTN", "MMR", "CHN", "NPL", "PAK"], continents: ["Asia"], flags: { png: "https://flagcdn.com/w320/in.png" }, maps: { googleMaps: "https://www.google.com/maps/place/India/@20.5937,78.9629,5z" }, cca3: "IND" },
    japan: { name: { common: "Japan" }, capital: ["Tokyo"], population: 125800000, region: "Asia", subregion: "Eastern Asia", currencies: { JPY: { name: "Japanese Yen" } }, area: 377930, languages: { jpn: "Japanese" }, timezones: ["UTC+09:00"], borders: [], continents: ["Asia"], flags: { png: "https://flagcdn.com/w320/jp.png" }, maps: { googleMaps: "https://www.google.com/maps/place/Japan/@36.2048,138.2529,5z" }, cca3: "JPN" },
    usa: { name: { common: "United States" }, capital: ["Washington, D.C."], population: 340000000, region: "Americas", subregion: "North America", currencies: { USD: { name: "United States Dollar" } }, area: 9372610, languages: { eng: "English" }, timezones: ["UTC-12:00"], borders: ["CAN", "MEX"], continents: ["North America"], flags: { png: "https://flagcdn.com/w320/us.png" }, maps: { googleMaps: "https://www.google.com/maps/place/United+States/@39.8,-98.5,4z" }, cca3: "USA" },
    france: { name: { common: "France" }, capital: ["Paris"], population: 68000000, region: "Europe", subregion: "Western Europe", currencies: { EUR: { name: "Euro" } }, area: 551695, languages: { fra: "French" }, timezones: ["UTC+01:00"], borders: ["AND", "BEL", "DEU", "ITA", "LUX", "MCO", "ESP", "CHE"], continents: ["Europe"], flags: { png: "https://flagcdn.com/w320/fr.png" }, maps: { googleMaps: "https://www.google.com/maps/place/France/@46.2,2.2,6z" }, cca3: "FRA" },
    germany: { name: { common: "Germany" }, capital: ["Berlin"], population: 84000000, region: "Europe", subregion: "Western Europe", currencies: { EUR: { name: "Euro" } }, area: 357114, languages: { deu: "German" }, timezones: ["UTC+01:00"], borders: ["AUT", "BEL", "CZE", "DNK", "FRA", "LUX", "NLD", "POL", "CHE"], continents: ["Europe"], flags: { png: "https://flagcdn.com/w320/de.png" }, maps: { googleMaps: "https://www.google.com/maps/place/Germany/@51.1,10.4,6z" }, cca3: "DEU" },
    "united kingdom": { name: { common: "United Kingdom" }, capital: ["London"], population: 67000000, region: "Europe", subregion: "Northern Europe", currencies: { GBP: { name: "British Pound" } }, area: 242900, languages: { eng: "English" }, timezones: ["UTC+00:00"], borders: ["IRL"], continents: ["Europe"], flags: { png: "https://flagcdn.com/w320/gb.png" }, maps: { googleMaps: "https://www.google.com/maps/place/United+Kingdom/@55.3,-3.4,6z" }, cca3: "GBR" }
};

function updateTime() {
    const now = new Date();
    timeEl.innerText = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';
}
updateTime();
setInterval(updateTime, 60000);
favCount.innerText = favorites.length;
renderCountry(localCountries.india);

searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') fetchCountry(searchInput.value.trim());
});

searchInput.addEventListener('input', async () => {
    const q = searchInput.value.trim().toLowerCase();
    if (q.length < 1) { suggestions.style.display = 'none'; return; }
    const list = Object.keys(localCountries).filter(k => k.includes(q));
    try {
        const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`);
        if (res.ok) {
            const data = await res.json();
            const names = data.slice(0, 5).map(c => c.name.common);
            const combined = [...new Set([...list.map(k => localCountries[k].name.common), ...names])];
            showSuggestionList(combined);
            return;
        }
    } catch { }
    showSuggestionList(list.map(k => localCountries[k].name.common));
});

function showSuggestionList(arr) {
    if (arr.length === 0) { suggestions.style.display = 'none'; return; }
    suggestions.innerHTML = arr.slice(0, 5).map(n => {
        const safe = n.replace(/'/g, "\\'");
        return `<div onclick="selectSuggestion('${safe}')">${n}</div>`;
    }).join('');
    suggestions.style.display = 'block';
}

function selectSuggestion(name) {
    searchInput.value = name;
    suggestions.style.display = 'none';
    fetchCountry(name);
}

async function fetchCountry(name) {
    if (!name) return;
    const key = name.toLowerCase();
    suggestions.style.display = 'none';
    resultArea.innerHTML = `<div class="card"><p class="loading">Loading ${name}...</p></div>`;
    try {
        let res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=true`);
        if (!res.ok) res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data[0]) { renderCountry(data[0]); return; }
        }
        throw new Error();
    } catch {
        if (localCountries[key]) {
            renderCountry(localCountries[key]);
        } else {
            const found = Object.values(localCountries).find(c => c.name.common.toLowerCase().includes(key));
            if (found) renderCountry(found);
            else resultArea.innerHTML = `<div class="card"><p class="error">Country "${name}" not found. Try India, USA, Japan, France, Germany</p></div>`;
        }
    }
}

function renderCountry(c) {
    currentCountry = c;
    const currKey = c.currencies ? Object.keys(c.currencies)[0] : '';
    const curr = currKey ? `${c.currencies[currKey].name} (${currKey})` : 'N/A';
    const pop = c.population > 1e9 ? (c.population / 1e9).toFixed(1) + ' Billion' : (c.population / 1e6).toFixed(1) + ' Million';
    const dens = c.area ? Math.round(c.population / c.area) : 'N/A';
    const isFav = favorites.find(f => f.cca3 === c.cca3);
    resultArea.innerHTML = `
    <div class="card">
      <div class="card-main">
        <div class="flag-box"><img src="${c.flags.png}" alt="${c.name.common}"></div>
        <div class="info">
          <h1>${c.name.common}</h1>
          <div class="row"><span class="label">Capital:</span><span class="value">${c.capital ? c.capital[0] : 'N/A'}</span></div>
          <div class="row"><span class="label">Population:</span><span class="value">${pop}</span></div>
          <div class="row"><span class="label">Region:</span><span class="value">${c.region}</span></div>
          <div class="row"><span class="label">Currency:</span><span class="value">${curr}</span></div>
          <div class="tags">
            <div class="tag">🌐 ${c.subregion || c.region}</div>
            <div class="tag">🏛 Population Density: ${dens}/km²</div>
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="btn" onclick="openDetails()">View More Details</button>
        <button class="btn btn-primary" onclick="toggleFav()">${isFav ? '❤️ Remove Favorite' : '♡ Save to Favorites'}</button>
      </div>
    </div>`;
    setActive('navExplore');
}

function toggleFav() {
    if (!currentCountry) return;
    const idx = favorites.findIndex(f => f.cca3 === currentCountry.cca3);
    if (idx >= 0) favorites.splice(idx, 1); else favorites.push(currentCountry);
    localStorage.setItem('favs', JSON.stringify(favorites));
    favCount.innerText = favorites.length;
    renderCountry(currentCountry);
}

function showFavorites() {
    setActive('navFav');
    if (favorites.length === 0) {
        resultArea.innerHTML = `<div class="card"><p style="text-align:center;padding:20px">No favorites yet. Search and save!</p></div>`;
        return;
    }
    resultArea.innerHTML = favorites.map(c => `
      <div class="card fav-card" onclick="fetchCountry('${c.name.common.replace(/'/g, "\\'")}')">
        <div class="card-main">
          <div class="flag-box" style="width:110px;height:75px"><img src="${c.flags.png}"></div>
          <div class="info"><h1 style="font-size:20px;margin-bottom:8px">${c.name.common}</h1>
          <div class="row"><span class="label">${c.capital ? c.capital[0] : ''}</span><span class="value">${c.region}</span></div></div>
        </div>
      </div>`).join('');
}

function showExplore() {
    setActive('navExplore');
    if (currentCountry) renderCountry(currentCountry); else renderCountry(localCountries.india);
}

function setActive(id) {
    document.querySelectorAll('.nav span').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function openSettings() { document.getElementById('settingsModal').style.display = 'flex'; }
function closeSettings() { document.getElementById('settingsModal').style.display = 'none'; }

function openDetails() {
    if (!currentCountry) return;
    const c = currentCountry;
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(c.name.common)}`;
    const lang = c.languages ? Object.values(c.languages).join(', ') : 'N/A';
    const area = c.area ? c.area.toLocaleString() + ' km²' : 'N/A';
    const time = c.timezones ? c.timezones[0] : 'N/A';
    const borders = c.borders ? c.borders.join(', ') : 'No Borders';
    document.getElementById('detailContent').innerHTML = `
      <h3>${c.name.common} - Wikipedia</h3>
      <div class="extra-grid">
        <div class="extra-box">Language<b>${lang}</b></div>
        <div class="extra-box">Area<b>${area}</b></div>
        <div class="extra-box">Timezone<b>${time}</b></div>
        <div class="extra-box">Borders<b style="font-size:11px">${borders}</b></div>
        <div class="extra-box">Continent<b>${c.continents}</b></div>
        <div class="extra-box">Maps<b><a href="${c.maps.googleMaps}" target="_blank" style="color:#5b9bd5">Open Map</a></b></div>
      </div>
      <div style="margin-top:14px;display:flex;gap:10px">
        <button class="btn btn-primary" onclick="window.open('${wikiUrl}','_blank')">Open Full Wikipedia</button>
        <button class="btn" onclick="closeDetails()">Close</button>
      </div>
      <iframe src="${wikiUrl}" style="width:100%;height:65vh;border:none;border-radius:10px;margin-top:14px;background:#fff"></iframe>
    `;
    document.getElementById('detailModal').style.display = 'flex';
}

function closeDetails() { document.getElementById('detailModal').style.display = 'none'; }
window.onclick = function (e) {
    if (e.target.id === 'settingsModal') closeSettings();
    if (e.target.id === 'detailModal') closeDetails();
}
document.getElementById('darkModeToggle').addEventListener('change', function () {
    document.body.style.filter = this.checked ? 'none' : 'brightness(1.3)';
});