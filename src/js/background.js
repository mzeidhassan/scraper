/*
 * background.js
 *
 * Author: dave@bit155.com
 *
 * ---------------------------------------------------------------------------
 *
 * Copyright (c) 2010, David Heaton
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright notice,
 *       this list of conditions and the following disclaimer.
 *
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *
 *      * Neither the name of bit155 nor the names of its contributors
 *        may be used to endorse or promote products derived from this software
 *        without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

const SCRAPE_SIMILAR_MENU_ID = 'scrape-similar';

const openViewer = (tab, options) => {
  const params = new URLSearchParams({
    tab: tab.id,
    options: JSON.stringify(options || {})
  });

  const url = `${chrome.runtime.getURL('viewer.html')}?${params.toString()}`;

  chrome.windows.create({
    url,
    type: 'popup',
    width: 960,
    height: 400
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const command = request && request.command;
  const payload = request && request.payload;

  if (command === 'scraperScrapeTab') {
    const tabId = parseInt(payload.tab, 10);
    chrome.tabs.sendMessage(
      tabId,
      { command: 'scraperScrape', payload: payload.options },
      (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            error:
              'Scraper could not access the page. Please reload the tab and try again.'
          });
          return;
        }
        sendResponse(response);
      }
    );
    return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: SCRAPE_SIMILAR_MENU_ID,
    title: 'Scrape similar...',
    contexts: ['all']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || info.menuItemId !== SCRAPE_SIMILAR_MENU_ID) {
    return;
  }

  let responded = false;
  const timeout = setTimeout(() => {
    if (!responded && tab.id) {
      chrome.tabs.reload(tab.id);
    }
  }, 750);

  chrome.tabs.sendMessage(tab.id, { command: 'scraperSelectionOptions' }, (response) => {
    responded = true;
    clearTimeout(timeout);

    if (chrome.runtime.lastError) {
      return;
    }

    openViewer(tab, response);
  });
});
