// ==UserScript==
// @name         피싱 링크 차단기
// @namespace    mickey90427
// @version      0.1
// @description  피싱 링크 차단기 Alt + Shift + P 단축키로 리스트 저장 / 로드 / 초기화 가능. (특정 주소만 따로 제거하려면 스크립트 대시보드 → 스크립트 수정 → 값 탭에서 따로 삭제)
// @icon         https://raw.githubusercontent.com/githubkorean/Link-Blocker/refs/heads/main/icon.png
// @author       You
// @match        *://*/*
// @supportURL   https://github.com/githubkorean/Link-Blocker
// @homepageURL  https://github.com/githubkorean/Link-Blocker
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @license      MIT
// ==/UserScript==

(async function () {
    'use strict';

    const STORAGE_KEY = 'phishingBlockedHosts';

    const getBlockedHosts = async () => {
        const stored = await GM_getValue(STORAGE_KEY, '[]');
        return JSON.parse(stored);
    };

    const addBlockedHost = async host => {
        const list = await getBlockedHosts();
        if (!list.includes(host)) {
            list.push(host);
            await GM_setValue(STORAGE_KEY, JSON.stringify(list));
            updateLinks();
        }
    };

    const updateLinks = async () => {
        const links = document.querySelectorAll('a[href]');
        const blockedHosts = await getBlockedHosts();

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            if (!href.startsWith('http')) return;

            try {
                const url = new URL(href, window.location.href);
                const userinfoExists = url.username !== '';

                if (userinfoExists) {
                    const actualHost = url.hostname;

                    if (blockedHosts.includes(actualHost)) {
                        const replacement = document.createElement('span');
                        replacement.textContent = '[차단된 URL]';
                        replacement.style.color = 'red';
                        link.replaceWith(replacement);
                        return;
                    }

                    link.style.backgroundColor = '#fff3cd';
                    link.style.border = '1px solid #ffa500';
                    link.title = `⚠️ 피싱 의심 링크: ${actualHost}`;

                    link.addEventListener('click', async function (e) {
                        e.preventDefault();

                        const confirmed = confirm(
                            `⚠️ 해당 사이트는 피싱 사이트일 수 있습니다.\n\n실제 연결 도메인: ${actualHost}\n\n계속하시겠습니까?`
                        );

                        if (confirmed) {
                            window.location.href = href;
                        } else {
                            const block = confirm(`${actualHost} 도메인을 차단 목록에 추가할까요?`);
                            if (block) {
                                await addBlockedHost(actualHost);
                                alert(`✅ 차단됨: ${actualHost}`);
                            }
                        }
                    });
                }
            } catch (err) {
                // 유효하지 않은 URL이면 무시
            }
        });
    };

    // 저장된 차단된 도메인 목록을 세이브하기
    const saveBlockedHosts = async () => {
        const list = await getBlockedHosts();
        const json = JSON.stringify(list);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'blocked_hosts.json';
        a.click();
        URL.revokeObjectURL(url);
        GM_notification("차단된 도메인 목록이 'blocked_hosts.json' 파일로 저장되었습니다.");
    };

    // JSON 파일로부터 차단된 호스트 목록 로드
    const loadBlockedHosts = async (file) => {
        const reader = new FileReader();
        reader.onload = async function (event) {
            try {
                const list = JSON.parse(event.target.result);
                await GM_setValue(STORAGE_KEY, JSON.stringify(list));
                GM_notification("차단된 도메인 목록이 로드되었습니다.");
                updateLinks(); // 실시간으로 적용
            } catch (err) {
                GM_notification("로드된 파일에 문제가 있습니다.");
            }
        };
        reader.readAsText(file);
    };

    // 차단된 도메인 목록 초기화
    const resetBlockedHosts = async () => {
        await GM_setValue(STORAGE_KEY, '[]');
        GM_notification("차단된 도메인 목록이 초기화되었습니다.");
        location.reload(); // 페이지 새로고침
    };

    // Shift + Alt + P 눌렀을 때 세이브/로드/초기화 처리
    window.addEventListener('keydown', async (e) => {
        if (e.shiftKey && e.altKey && e.key === 'P') {
            const action = prompt("세이브(1), 로드(2), 초기화(3)를 선택하세요: ");
            if (action === '1') {
                await saveBlockedHosts();
            } else if (action === '2') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) loadBlockedHosts(file);
                };
                input.click();
            } else if (action === '3') {
                const confirmReset = confirm("차단된 도메인 목록을 초기화하시겠습니까?");
                if (confirmReset) await resetBlockedHosts();
            } else {
                alert("잘못된 입력입니다.");
            }
        }
    });

    updateLinks();

})();
