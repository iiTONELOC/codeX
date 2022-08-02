const enterKeyCode = 13;
const maxQueryLength = 256;
const maxHistoryLength = 15;
const historyName = 'codex_search_history';
const regEx = /[.,:;/\\`'"=*!?#$&+^|~<>(){}[\]@]/g;

let originalQuery;
let searchHistory = JSON.parse(localStorage.getItem(historyName)) || [];

// _________Functions relating to Searching GitHub_________
/**
 * Takes the _currentQuery object, adds it to the searchHistory array, and updates localStorage.
 * @param {object} _currentQuery - The current query object to add to the searchHistory array.
 *
 * @example
 * ```js
 * // Required properties:
 *
 * {
*       originalQuery: string - The original unsanitized query.
*       time: number - The time the query was searched (Date.now()).
*       query: string - The sanitized query that was searched on GitHub.
*       url: string - The crafted URL to search GitHub with.
 * }
 *
 * ```
 */
function addToSearchHistory(_currentQuery) {
    searchHistory.push({ ..._currentQuery });
    // only keep the last 15 items in the history
    if (searchHistory.length > maxHistoryLength) {
        searchHistory.shift();
    }
    localStorage.setItem(historyName, JSON.stringify(searchHistory));
    renderHistoryItem(_currentQuery);
}

/**
 * Opens a search in a new tab and adds the query to the search history.
 *
 * @param {string} _query The sanitized query to search GitHub with.
 * @returns {void} This function does not return anything but will search GitHub with the given query in a new tab.
 */
function searchGitHubNewTab(_query) {
    const URL = `https://github.com/search?q=${_query}&type=code`;
    addToSearchHistory({
        originalQuery,
        time: Date.now(),
        query: _query,
        url: URL
    });

    window.open(URL, '_blank');
}

/**
 * Removes tokens from the string that a GitHub code search will not accept.
 * By default these characters are not interpreted so they are removed.
 * ```. , : ; / \ ` ' " = * ! ? # $ & + ^ | ~ < > ( ) { } [ ] @```
 * @param {string} str The string to sanitize
 * @returns {string} The sanitized string
 */
const sanitizeInput = str => str.replace(regEx, ' ').replace(/ {2,}/g, ' ').trim();

/**
 * Finalizes the query by replacing the whitespace between search terms with a +.
 * @param {string} sanitizedQuery The sanitized query to search GitHub with.
 * @returns {string} The query string to search GitHub with
 */
const buildQueryString = sanitizedQuery => sanitizedQuery.split(' ').join('+');

/**
 * Handles the search request when the user clicks the search button.
 *
 * @param {object} e event object
 */
function searchHandler(e) {
    e.preventDefault();
    e.stopPropagation();

    const searchInput = document.querySelector('#codex-search');
    originalQuery = searchInput.value.trim();

    const sanitized = sanitizeInput(originalQuery);
    let query;

    if (sanitized.length > 0) {
        // if the query is longer than the max length, truncate it
        query = (sanitized.length > maxQueryLength) ?
            buildQueryString(sanitized.slice(0, maxQueryLength))
            : buildQueryString(sanitized);

        // reset the input field
        searchInput.value = '';

        query && searchGitHubNewTab(query);
    }

}

// __________ END ___________

// ______Functions relating to Rendering to the DOM______

/**
 * Formats a serialized timestamp into a human readable date.
 * @param {string} _time Valid timestamp as a string to format
 * @returns {string}
 */
const formatTime = _time => new Date(_time).toLocaleString();

/**
 * Renders an SVG in a span element. The SVG is centered in a flex container.
 * @param {string} svgPath The SVG inner path to render
 * @returns {string}
 */
function svgIcon(svgPath, extraSvgClasses = '') {
    return `<span class="svg-container">
                <svg xmlns="http://www.w3.org/2000/svg" class="${extraSvgClasses}"viewBox="0 0 20 20" fill="currentColor">
                    ${svgPath}
                </svg>
            </span>`;
}

/**
 * Creates a <Li> History Item Element for the search history.
 * Adds tabindex to the <li> and directly to the SVG path to allow keyboard navigation.
 *
 * @param {object} _history The individual search history item containing the query, time, and URL.
 * @returns {string} The HTML string for the <Li> element.
 */
function historyItem(_history) {
    const historyData = [
        formatTime(_history.time),
        _history.query
    ];

    const pEl = () => historyData.map(text => `<p> ${text}</p>`).join('\n');

    return (
        `<li tabindex=0 id=${_history.time}>
            ${svgIcon(`<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" 
                clip-rule="evenodd" />`)}

            <section>
                <a href="${_history.url}" target="_blank" rel="noopener noreferrer">${pEl()}</a>
            </section>

            ${svgIcon(`<path tabindex=0 data-id=${_history.time} fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2
                2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1
                1 0 00-1-1z" clip-rule="evenodd"/>`, 'delete-icon')}
        </li>`
    );
}
/**
 * Adds the individual history item to the #historyList element.
 * @param {string} _item The HTML string for the <Li> element.
 */
function renderHistoryItem(_item) {
    document.querySelector('#history-list').innerHTML += historyItem(_item);
}


/**
 *  Loops over the searchHistory array and renders each item in the history list.
 * @returns void
 */
const renderHistory = _ => searchHistory.forEach(item => renderHistoryItem(item));



// _________Functions relating to Search History_________

/**
 * Removes a history item by timestamp from the searchHistory array.
 * @param {string} _time Timestamp of the search history item as a string
 */
function deleteSearchHistoryItem(_time) {
    searchHistory = searchHistory.filter(item => item.time !== parseInt(_time));

    localStorage.removeItem(historyName);
    localStorage.setItem(historyName, JSON.stringify(searchHistory));
}

/**
 * Used directly by the delete button to remove a history item from the DOM and the searchHistory array.
 * @param {object} e Event object
 */
function handleItemDeletion(e) {
    const target = e.target;
    const id = target.getAttribute('data-id');
    deleteSearchHistoryItem(id);
    deleteSearchHistoryItemFromDom(id);
}

/**
 * Removes the DOM element for a history item by timestamp.
 * @param {string} _id Timestamp of the search history item as a string
 */
function deleteSearchHistoryItemFromDom(_id) {
    const item = document.getElementById(_id);
    item.remove();
}

// _________END_________

// __________MAIN___________

/**
 * Listens for Keyboard events when a delete button has been targeted by the tab key. When the enter key
 * has been pressed, the item is removed from the DOM, searchHistory array, and localStorage via
 * the `handleItemDeletion ()`.
 * @param {object} e Event object
 */
function enterKeyListener(e) {
    const target = e.target;
    const id = target.getAttribute('data-id');
    id && e.keyCode === enterKeyCode && handleItemDeletion(e);
}

function historyListHandlers(e) {
    const target = e.target;
    const id = target.getAttribute('data-id');

    // links to the previous search when clicking the li element
    // deletes the item when clicking the delete button
    id && handleItemDeletion(e);
}

function addListeners() {
    document.addEventListener('keyup', enterKeyListener);
    document.querySelector('#search-btn').addEventListener('click', searchHandler);
    document.querySelector('#history-list').addEventListener('click', historyListHandlers);
}

function main() {
    renderHistory();
    addListeners();
}

document.addEventListener('DOMContentLoaded', () => main());
