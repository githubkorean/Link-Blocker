// ==UserScript==
// @name         피싱 링크 차단기
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  @ 포함된 http/https 링크를 [Blocked URL] 텍스트+커스텀 링크 덮개로 대체
// @icon         https://raw.githubusercontent.com/githubkorean/Link-Blocker/refs/heads/main/icon.png
// @author       mickey90427@naver.com
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const customUrl = 'https://www.google.com';  // 사용자 원하는 링크로 변경 가능

    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        if (href.startsWith('mailto:')) return;

        if ((href.startsWith('http://') || href.startsWith('https://')) && href.includes('@')) {
            link.removeAttribute('href');
            link.textContent = '[Blocked URL]';
            link.style.color = 'red';
            link.style.fontWeight = 'bold';
            link.style.textDecoration = 'none';
            link.style.cursor = 'default';

            // 새 하이퍼링크 엘리먼트 생성 (덮어씌우기)
            const overlay = document.createElement('a');
            overlay.href = customUrl;
            overlay.target = '_blank';
            overlay.textContent = '[Blocked URL]';
            overlay.style.color = 'red';
            overlay.style.fontWeight = 'bold';
            overlay.style.textDecoration = 'underline';
            overlay.style.cursor = 'pointer';

            link.replaceWith(overlay);
        }
    });
})();
