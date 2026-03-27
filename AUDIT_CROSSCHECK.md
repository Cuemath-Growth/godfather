# Claude Browser Audit — Cross-Validation Against CHANGELOG

## Verdict Key
- FIX = Valid finding, should fix
- WRONG = Browser got this wrong, our implementation is correct
- KNOWN = Known limitation, by design or deferred
- DONE = Already fixed in a previous session

---

## SECTION 1 — Data Infrastructure & Onboarding

1. **No first-run onboarding** → FIX (partially). Oracle empty state exists (CHANGELOG: "Oracle Empty State Examples") and links to Settings. But Settings itself has no schema guidance or sample links. Add help text.

2. **Currency mismatch (INR for US)** → WRONG. All Meta spend data is in INR even for US campaigns. ₹ is correct. This is Cuemath's reporting currency.

3. **API keys in localStorage** → KNOWN. Client-side app by design. The copy "never sent to any server" IS inaccurate though — keys ARE sent to Anthropic/Google. FIX the copy only.

4. **Test Connection no feedback** → FIX. No spinner or success indicator.

5. **Meta token expiry** → KNOWN. No auto-refresh possible without OAuth. Could add expiry warning. Deferred.

## SECTION 2 — Oracle

6. **Example panels look like real data** → FIX. Just done — added "Example insights" label, dashed borders, 60% opacity.

7. **Stale Data Warning on cold start** → CHECK. CHANGELOG says "checkStaleData() only shows getting-started if user has configured keys." Need to verify the code actually handles no-data state correctly.

8. **Date range picker broken** → CHECK. Need to verify if this is the Oracle date filter or something else.

9. **"This Week vs Last Week" empty** → CHECK. CHANGELOG says "WoW badge arrows" were fixed. Need to verify the heading isn't orphaned.

10. **Ask Oracle single-turn** → KNOWN. Chatbot is a data query tool, not a conversation. By design.

11. **Market Health ₹ for US** → WRONG. Same as #2. INR is correct.

12. **Re-analyze vs Refresh identical** → CHECK. May be worth merging or adding tooltips.

## SECTION 3 — Forge

13. **Brief/Freeform coexist** → CHECK. CHANGELOG says mode toggle exists (setGenerateMode). But is it mutually exclusive? Need to verify.

14. **Winning Formula no explanation** → KNOWN partially. CHANGELOG: "Shows Winning Formula Active indicator with specific combo and CPTD." Has tooltip per CHANGELOG. But may need better empty state when no Lens data.

15. **Status controls pre-generation** → FIX. Should hide until content generated.

16. **Gemini block orphaned** → CHECK. Should only appear after text generation.

17. **Refine/Variant no tooltip** → FIX. Quick tooltip addition.

18. **"Asian" ICP segment** → KNOWN. Matches Meta targeting vocabulary used in campaigns. Not a Cuemath ICP but maps to ad targeting.

19. **Reset button styling** → FIX. Already changed from gradient to text link styling.

## SECTION 4 — Lens: Tag

20. **Tag taxonomy mismatch** → CHECK. CHANGELOG doesn't mention taxonomy spec. Need to verify against the tagger prompt's actual taxonomy.

21. **Empty table no schema guidance** → FIX. Add CSV template download or column list.

22. **Sort controls above empty table** → FIX. Disable when no data.

23. **Heatmap color scale undefined** → FIX. Clarify "cheaper than portfolio average."

24. **ROW/APAC inconsistency** → DONE. CHANGELOG: "All dropdowns now use APAC (not ROW)." If still inconsistent somewhere, it's a regression.

## SECTION 5 — Lens: Intel

25. **Intel blocked behind Tag** → KNOWN. By design — Intel needs tagged data. But should show a clearer message.

26. **Generate Briefs no output path** → CHECK. Need to trace where briefs render.

27. **"USAUS" concatenation bug** → FIX. Real rendering bug.

28. **Audience Performance Map empty** → CHECK. May need data to render.

## SECTION 6 — Library

29. **Legend with no creatives** → FIX. Hide legend when empty.

30. **Add Creative clipboard workaround** → KNOWN. Google Sheets API write requires OAuth. Clipboard is the current integration. Document better.

31. **Tag Unanalysed no explanation** → FIX. Already partially fixed (button now always visible). Add tooltip.

32. **UK missing from Add Creative** → FIX.

## SECTION 7 — Sentinel

33. **No RAG threshold scoring** → CHECK. CHANGELOG mentions "threshold scoring" in Sentinel subtitle. Need to verify if color coding exists in the table via SCORE_STYLES.

34. **Top 5/Bottom 5 empty shells** → FIX. Show proper empty state.

35. **Campaign/AdSet/Ad toggle untestable** → KNOWN. Works with data — browser had no data to test.

36. **CPQL vs CPTQL** → WRONG. These ARE different metrics. CPQL = Spend/QL, CPTQL = Spend/TQL. CHANGELOG line 252: "duplicate CPTQL → first is CPQL, second is CPTQL." Already fixed.

## SECTION 8 — Influencer

37. **Loading... spinner** → DONE. We added empty state in this session. But "Loading..." in status badge may still show briefly. FIX badge default text.

38. **Vision Scan no explanation** → FIX. Add tooltip/description.

39. **Influ vs In-House no description** → FIX. Add subtitle explaining the comparison.

40. **Upload modal UX** → KNOWN. Minor issue.

## SECTION 9 — Global UI/UX

41-46. **Loading states, sidebar active state, responsive, error boundaries, keyboard nav, logo** → KNOWN. Architectural improvements for a future session. Not quick fixes.

---

## PRIORITY FIXES (this session)

### Must Fix (broken/misleading):
- #4: Test Connection feedback
- #7: Stale Data Warning on cold start (verify)
- #15: Hide status/version controls pre-generation
- #21: CSV schema hint for tagger
- #22: Disable sort controls when empty
- #27: USAUS concatenation bug
- #32: UK in Add Creative
- #34: Sentinel Top5/Bottom5 empty state
- #37: Loading badge text
- #38: Vision Scan description
- #39: Influ vs In-House subtitle

### Should Fix (polish):
- #3: Fix localStorage security copy
- #17: Refine/Variant tooltips
- #23: Heatmap "cheaper than" clarification
- #29: Library legend hide when empty
- #31: Tag Unanalysed tooltip
