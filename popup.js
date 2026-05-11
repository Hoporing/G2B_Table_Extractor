document.getElementById('extractButton').addEventListener('click', () => {
    const tableId = 'mf_wfm_container_grdCtrtLis_body_table';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: extractTableData,
            args: [tableId]
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                alert("An error occurred during script execution. Check the extension's console for details.");
                return;
            }
            if (results && results[0] && results[0].result) {
                const data = results[0].result;
                if (data.length <= 1) { // Only headers or empty
                    alert("No data rows were extracted. Please check the table ID and ensure the table contains data.");
                    return;
                }
                createExcelFile(data);
            } else {
                alert("Failed to extract data. The specified element was not found, or an error occurred. Check the target page's console for more details.");
            }
        });
    });
});

async function extractTableData(tableId) {
    const tableElement = document.getElementById(tableId);
    const scrollableDivId = tableId.replace('_body_table', '_scrollY_div');
    const scrollableDiv = document.getElementById(scrollableDivId);
    const totalCountSpan = document.getElementById('mf_wfm_container_tbxGoodsLisCont');

    if (!tableElement || !scrollableDiv || !totalCountSpan) {
        console.error("Extraction failed: A required element was not found.", { tableId, scrollableDivId, totalCountSpanId: 'mf_wfm_container_tbxGoodsLisCont' });
        return null;
    }

    // 1. Get Total Count
    const totalCountText = totalCountSpan.innerText.split('/')[1];
    const totalCount = parseInt(totalCountText, 10);
    if (isNaN(totalCount) || totalCount === 0) {
        console.error("Could not determine total row count.");
        return null;
    }

    const waitForChange = (elementToObserve) => {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => { observer.disconnect(); resolve(true); });
            const timeout = setTimeout(() => { observer.disconnect(); resolve(false); }, 500);
            observer.observe(elementToObserve, { childList: true, subtree: true });
        });
    };

    const allData = [];
    const seenRowNumbers = new Set();

    const table = tableElement.closest('table');
    let headers = [];
    if (table && table.querySelector('thead tr')) {
        headers = Array.from(table.querySelector('thead tr').querySelectorAll('th, td')).map(cell => cell.innerText.trim());
        if (headers.length > 9) {
            headers = headers.slice(0, 9);
        }
    }

    // 2. Loop until all data is collected
    while (seenRowNumbers.size < totalCount) {
        const lastKnownSize = seenRowNumbers.size;
        const validRows = Array.from(tableElement.querySelectorAll('tr')).filter(row => row.querySelector('input'));

        validRows.forEach(row => {
            const filteredCells = Array.from(row.cells).filter(cell => {
                const button = cell.querySelector('button');
                return !button;
            });

            let rowData = filteredCells.map(cell => {
                const input = cell.querySelector('input, select, textarea');
                return input ? input.value.trim() : cell.innerText.trim();
            });

            if (rowData.length > 9) {
                rowData = rowData.slice(0, 9);
            }

            const rowNumber = rowData[0];
            if (rowNumber && !isNaN(parseInt(rowNumber, 10)) && !seenRowNumbers.has(rowNumber)) {
                seenRowNumbers.add(rowNumber);
                allData.push(rowData);
            }
        });

        // If we are stuck and can't find new rows, break.
        if (seenRowNumbers.size === lastKnownSize && lastKnownSize === totalCount) {
            break;
        }

        const lastScrollTop = scrollableDiv.scrollTop;
        scrollableDiv.scrollTop += 40;
        await waitForChange(tableElement);

        if (scrollableDiv.scrollTop === lastScrollTop) {
            // If scroll position doesn't change, we've likely hit the bottom.
            // If we still haven't found all rows, it's an unrecoverable error.
            if (seenRowNumbers.size < totalCount) {
                console.error(`Found ${seenRowNumbers.size} rows but expected ${totalCount}. The scroll ended prematurely.`);
            }
            break;
        }
    }

    // 3. Final Sort
    allData.sort((a, b) => {
        const numA = parseInt(a[0], 10);
        const numB = parseInt(b[0], 10);
        return numA - numB;
    });

    if (headers.length > 0) {
        allData.unshift(headers);
    }

    return allData;
}

function createExcelFile(data) {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table_data.xlsx");
}