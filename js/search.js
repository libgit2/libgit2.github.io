let indexLoaded = false;
let indexLoadError = undefined;
let index = undefined;

const referencePath = `/docs/reference`;
const searchPath = `${referencePath}/search`;
const indexPath = `/docs/search-index`;

const defaultVersion = 'main';
let version = defaultVersion;

// determine path
const currentUrl = new URL(window.location);

if (currentUrl.pathname.startsWith(referencePath + '/')) {
    version = currentUrl.pathname.substr(referencePath.length + 1)
                                 .replace(/\/.*/, '');

    if (!version || version == 'search') {
        version = new URLSearchParams(window.location.search).get('version');
    }

    if (!version) {
        version = defaultVersion;
    }
}

const indexUrl = `${currentUrl.origin}${indexPath}/${version}.json`;
console.log(indexUrl);

fetch(indexUrl)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`could not load search json: ${response.status}`);
    }

    return response.text();
  })
  .then((json) => {
    index = MiniSearch.loadJSON(json, {
      fields: [ 'name', 'description', 'detail' ],
      storeFields: [ 'name', 'kind', 'description' ],
      searchOptions: { boost: { name: 5, description: 2 } }
    });
    
    indexLoaded = true;
  })
  .then(() => {
    const searchbox = document.getElementById("headersearchbox");

    if (!searchbox) {
      return;
    }

    document.addEventListener("click", function (e) {
      if (e.target !== searchbox) {
        document.getElementById("headersearchresults").style.visibility = "hidden";
      }
    });

    handleSearchSuggest({ version: version });
  })
  .then(() => {
    if (!document.getElementById("bodysearchbox")) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const searchText = params.get('q');

    if (searchText) {
      document.getElementById("bodysearchbox").value = searchText;
      showSearchResults({ onload: true });
    }
    else {
      document.getElementById("bodysearchbox").focus();
    }
  })
  .catch((err) => {
    indexLoadError = err;
    showSearchResults({ onload: true });
  });

function handleSearchSuggest(props) {
  document.getElementById("headersearchresults").innerHTML = "";
  document.getElementById("headersearchresults").classList.remove("searchResultsError");
  document.getElementById("headersearchresults").classList.remove("searchResultsLoading");

  if (indexLoadError) {
    document.getElementById("headersearchresults").innerHTML = indexLoadError;
    document.getElementById("headersearchresults").classList.add("searchResultsError");
    document.getElementById("headersearchresults").style.visibility = "visible";
    return;
  }
  if (!indexLoaded) {
    document.getElementById("headersearchresults").innerHTML = "Loading...";
    document.getElementById("headersearchresults").classList.add("searchResultsLoading");
    document.getElementById("headersearchresults").style.visibility = "visible";
    return;
  }

  const searchText = document.getElementById("headersearchbox").value;

  if (searchText === "") {
    document.getElementById("headersearchresults").style.visibility = "hidden";
    return;
  }

  if (!headerSearchIsFocused()) {
    document.getElementById("headersearchresults").style.visibility = "hidden";
    return;
  }

  const results = index.autoSuggest(searchText);
  const suggestions = [];

  for (const result of results) {
    for (const term of result.terms) {
      if (suggestions.includes(term)) {
        continue;
      }

      suggestions.push(term);

      if (suggestions.length === 5) {
        break;
      }
    }

    if (suggestions.length === 5) {
      break;
    }
  }

  if (suggestions.length === 0) {
    document.getElementById("headersearchresults").style.visibility = "hidden";
    return;
  }

  let resultsHTML = "<ul>";

  for (const suggestion of suggestions) {
    let url = `${searchPath}?q=${suggestion}`;

    if (props.version && props.version !== defaultVersion) {
      url += `&version=${props.version}`;
    }

    resultsHTML += `<li><a href="${url}" onClick="document.getElementById('headersearchbox').value = '${suggestion}'; return true;">${suggestion}</a></li>`;
  }

  resultsHTML += "</ul>";

  document.getElementById("headersearchresults").innerHTML = resultsHTML;
  document.getElementById("headersearchresults").style.visibility = "visible";
}

function headerSearchIsFocused() {
  let element = document.activeElement;

  while (element != null) {
    if (element.id === "headersearcharea") {
      return true;
    }

    element = element.parentElement;
  }

  return false;
}

function submitSearch() {
  const searchText = document.getElementById("headersearchbox").value;

  if (searchText) {
    document.getElementById("headersearchresults").style.visibility = "hidden";
    window.location = `${searchPath}?q=${searchText}`;
  }
}

function setPage(props) {
  window.history.pushState(null, `${props.searchText} - API search (libgit2)`, `?q=${props.searchText}&page=${props.page}`);
  showSearchResults({ onload: true });
  return false;
}

function showPaginator(props) {
  const count = 5;
  let start, end;
  let html = "";

  if (props.pages === 1) {
    return "";
  }

  if (props.page < count) {
    start = 1;
    end = Math.min(count, props.pages);
  }
  else if (props.page === props.pages) {
    start = Math.max(1, (props.pages - count) + 1);
    end = props.pages;
  }
  else {
    start = (props.page + 1) - (count - 1);
    end = props.page + 1;
  }

  html += `<div class="searchPagesArea">`;
  html += `<span class="searchPagesPrompt">Pages:</span>`;
  html += `<ul class="searchPages">`;

  const aLink = (searchText, page) => `href="?q=${searchText}&page=${page}" onClick="return setPage({ searchText: '${searchText}', page: ${page} })"`;

  if (props.page > 1) {
    html += `<li class="searchPagePrevious"><a ${aLink(props.searchText, props.page - 1)}>← Prev</a></span>`;
  }

  for (let i = start; i <= end; i++) {
    const current = (i === props.page) ? 'Current' : '';
    html += `<li class="searchPage${current}"><a ${aLink(props.searchText, i)}>${i}</a></span>`;
  }

  if (props.page < props.pages) {
    html += `<li class="searchPageNext"><a ${aLink(props.searchText, props.page + 1)}>Next →</a></span>`;
  }

  html += `</ul>`;
  html += `</div>`;

  return html;
}

function setSearchVersion(v) {
  const query = new URLSearchParams(window.location.search).get('q');
  let location = `?`;

  if (query) {
    location += `q=${query}&`;
  }

  location += `version=${v}`;

  window.location = location;
}

function resetSearch() {
  const searchText = document.getElementById("bodysearchbox").value;
  window.history.pushState(null, `${searchText} - API search (libgit2)`, `?q=${searchText}`);
  showSearchResults({ onload: true });
}

function showSearchResults(props) {
  const searchText = document.getElementById("bodysearchbox").value;

  if (document.getElementById('searchversion')) {
    document.getElementById('searchversion').value = version;
  }

  let page = new URLSearchParams(window.location.search).get('page');

  if (page && page.match(/^\d+$/)) {
    page = parseInt(page, 10);
  }
  else {
    page = 1;
  }

  if (indexLoadError) {
    document.getElementById("bodyresultsarea").style.visibility = "visible";
    document.getElementById("bodysearchresults").innerHTML =
        `<div class="searchResultsError">${indexLoadError}</div>`;
    return;
  }

  if (!searchText) {
    document.getElementById("bodyresultsarea").style.visibility = "hidden";
    window.history.pushState(null, `${searchText} - API search (libgit2)`, ``);
    return;
  }

  const count = 10;
  const results = index.search(searchText);
  const pages = Math.ceil(results.length / count);
  const start = (page > 1) ? (page - 1) * count : 0;

  document.getElementById("bodysearchbox").blur();
  document.getElementById("bodysearchresults").focus();

  if (results.length === 0) {
    document.getElementById("bodysearchresults").innerHTML =
        `<div class="searchResultsEmpty">No results.</div>`;
    document.getElementById("bodyresultsarea").style.visibility = "visible";
    window.history.pushState(null, `${searchText} - API search (libgit2)`, `?q=${searchText}`);
    return;
  }

  if (page > pages) {
    return resetSearch();
  }

  let resultsHTML = `<ul class="searchApis">`;

  for (let i = start; i < start + count && i < results.length; i++) {
    const result = results[i];
    const description = result.description;

    const link = `/docs/reference/${version}/${result.group}/${result.name}.html`;

    resultsHTML += `<li>`;
    resultsHTML += `  <a href="${link}">`;
    resultsHTML += `    <div class="searchResultName">${result.name}</div>`;
    resultsHTML += `    <div class="searchResultKind">${result.kind}</div>`;
    resultsHTML += `    <div class="searchResultDescription">`;
    resultsHTML +=        markdown.render(result.description || "");
    resultsHTML += `    </div>`;
    resultsHTML += `  </a>`;
    resultsHTML += `</li>`;
  }
  resultsHTML += `</ul>`;

  resultsHTML += showPaginator({ searchText: searchText, page: page, pages: pages });

  document.getElementById("bodysearchresults").innerHTML = resultsHTML;
  document.getElementById("bodyresultsarea").style.visibility = "visible";

  if (!props?.onload) {
    let segment = `?q=${searchText}`;

    if (page != 1) {
      segment += `&page=${page}`;
    }

    window.history.pushState(null, `${searchText} - API search (libgit2)`, segment);
  }
}
