import { html, render } from 'https://unpkg.com/lit@3.1.2?module';
import { component, useEffect, useMemo, useState } from 'https://unpkg.com/@pionjs/pion?module';


function extractIngredients(drink) {
  const items = [];
  for (let i = 1; i <= 15; i++) {
    const ing = drink[`strIngredient${i}`];
    if (ing && ing.trim()) {
      items.push(ing.trim());
    }
  }
  return items;
}

function normalizeIngredient(name) {
  return name.trim().toLowerCase();
}

function formatIngredient(name) {
  const n = name.trim();
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

const Results = component(function Results({ results, onAdd }) {
  if (!results) return html``;
  if (results.length === 0) {
    return html`<p class="muted">No results found.</p>`;
  }
  return html`
   <style>
    .drink{
      display: flex; 
      gap: 15px;
      margin-bottom: 30px;     
      border: 1px solid var(--border);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      padding: 5px;
      border-radius: 10px;
      background-color: #242E42;
    }
    .name{
      font-weight: 700;
      margin-bottom: 5px;
    }
    .instructions{
      font-size: 14px;
      line-height: 16px;
      margin-bottom: 10px;
    }
    .btn-green {
      background-color: #16a34a;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin: 10px 0; 
      transition: all 0.25s;
    }
    .btn-green:hover {
      background-color: #15803d;
    }
    </style>
  
  ${results.map(
    (d) => html`
   <article class="drink">
        <img class="thumb" style="max-width: 140px; height: 100%;" src="${d.strDrinkThumb}" alt="${d.strDrink}" loading="lazy" />
        <div class="meta">
          <div class="name">${d.strDrink}</div>
          <div class="instructions">${d.strInstructions || ''}</div>
          <button class="btn-green" @click=${() => onAdd(d)}>Add to shopping list</button>
        </div>
      </article>`
  )}`;
});
customElements.define('x-results', Results);

const ShoppingList = component(function ShoppingList({ items, onRemove }) {
  const all = Array.from(items.values()).sort((a, b) => a.localeCompare(b));
  if (all.length === 0) return html``;
  return html`
  
  <style>
  .btn-danger{
    background: transparent;
    color: red;
    border: none;
    cursor: pointer;
    font-size: 10px;
  }
  </style>
  
  ${all.map(
    (name) =>
      html`<div class="chip">
        <span>${name}</span>
        <button class="btn-danger" @click=${() => onRemove(name)} title="Remove">✕</button>
      </div>`
  )}`;
});
customElements.define('x-shopping', ShoppingList);

const App = component(function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [bag, setBag] = useState(() => new Map());

  const isEmpty = useMemo(() => bag.size === 0, [bag]);

  async function doSearch(q) {
    if (!q) return;
    setLoading(true);
    setToast('Searching...');
    try {
      const url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      const data = await res.json();
      const drinks = data && data.drinks ? data.drinks : [];
      setResults(drinks);
      setToast(drinks.length ? 'Here are the results.' : 'No results found.');
    } catch (e) {
      console.error(e);
      setResults([]);
      setToast('No results found.');
    } finally {
      setLoading(false);
    }
  }

  function addDrinkIngredients(drink) {
    const next = new Map(bag);
    for (const raw of extractIngredients(drink)) {
      const key = normalizeIngredient(raw);
      if (!next.has(key)) {
        next.set(key, formatIngredient(raw));
      }
    }
    setBag(next);
    setToast('Ingredients added to shopping list.');
  }

  function removeIngredient(name) {
    const next = new Map(bag);
    for (const [key, val] of next.entries()) {
      if (val.toLowerCase() === name.toLowerCase()) {
        next.delete(key);
        break;
      }
    }
    setBag(next);
    setToast('Ingredient removed from shopping list.');
  }

  useEffect(() => {
    const form = document.getElementById('search-form');
    const input = document.getElementById('query');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      doSearch(input.value.trim());
    });
    const printBtn = document.getElementById('print');
    const clearBtn = document.getElementById('clear');
    printBtn.addEventListener('click', () => window.print());
    clearBtn.addEventListener('click', () => {
      setBag(new Map());
      setToast('Shopping list cleared.');
    });
  }, []);

  useEffect(() => {
    const listWrap = document.getElementById('list-wrap');
    render(html`<x-shopping .items=${bag} .onRemove=${removeIngredient}></x-shopping>`, listWrap);
    const emptyMsg = document.getElementById('empty');
    emptyMsg.style.display = bag.size === 0 ? 'block' : 'none';
  }, [bag]);

  useEffect(() => {
    const toastBox = document.getElementById('toast-box');
    if (toast) {
      render(html`<div>${toast}</div>`, toastBox);
    } else {
      render(html`<div></div>`, toastBox);
    }
  }, [toast]);

  const busy = loading ? 'true' : 'false';
  const resMount = document.getElementById('results');
  if (resMount) resMount.setAttribute('aria-busy', busy);

  return html`
    <x-results .results=${results} .onAdd=${addDrinkIngredients}></x-results>
  `;
});
customElements.define('cocktail-app', App);

render(html`<cocktail-app></cocktail-app>`, document.getElementById('results'));
