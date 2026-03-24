## 2026-03-24 - DOM caching opportunity
**Learning:** Found widespread use of document.getElementById inside tight loops and frequent event handlers (like renderLogin, updateStatsCards) across the app, which might cause layout thrashing and slowdowns if called often.
**Action:** Implement a small utility or cache elements for a highly used function to improve performance without adding dependencies.
## 2024-03-24 - O(N) LocalStorage Parse Optimization
**Learning:** Found an O(N) double-parsing pattern where `getExplorerRank` would evaluate the entire progression history of all 7 apps (parsing JSON from localStorage) twice per rank check, which happens per-profile on the dashboard. Also, `getActiveUser()` was invoked twice in the same inline condition `userName || (getActiveUser() ? getActiveUser().name : null)`, forcing multiple redundant parses.
**Action:** Refactored `getTotalStars` and `getExplorerRank` to share a single parsing loop (`getPlayerStats`) and cached `getActiveUser()` in tight scopes to reduce redundant parsing and memory thrashing.
