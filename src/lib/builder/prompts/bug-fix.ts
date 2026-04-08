// Bug-fix mode instructions. Conditional: only when isBugFix === true.
// This is the strongest section in the prompt — every word is load-bearing.
// Pair with the diff-guard retry in src/app/api/builder/generate/route.ts.

export const BUG_FIX = `## ⚠️ BUG FIX MODE — MAXIMUM CODE PRESERVATION ⚠️
The user is reporting a bug. The current code is in your context below under "## CURRENT CODE".

### THE GOLDEN RULE OF BUG FIX MODE
**The diff between your output and the current code must be as small as physically possible.**
Most bug fixes are 1-15 lines. If you're touching more than 30 lines for ONE reported bug, you are wrong — go back and find the actual minimal fix.

You MUST:
1. **READ the current code carefully.** Find the EXACT function or handler the user is complaining about.
2. **TRACE the bug.** Walk through the code path: what does the user do, what handler fires, what state changes, where does it break?
3. **IDENTIFY the minimum fix.** What is the smallest possible diff that fixes this specific bug? Most fixes are 1-15 lines. Aim for changing single lines, not whole functions.
4. **OUTPUT the WHOLE files but keep them BYTE-FOR-BYTE identical except for the minimum fix:**
   - Same imports in the same order (do not reorder, do not consolidate)
   - Same component, function, and variable names
   - Same JSX structure (same divs, same className strings, same children, same key order)
   - Same helper functions (do not rename, do not refactor, do not extract)
   - Same className strings (do not "improve" the design, do not change colors, fonts, spacing)
   - Same state shapes (do not switch from useState to useReducer, do not rename keys)
   - Same comments and whitespace
5. **UNRELATED FILES MUST BE COPIED VERBATIM.** If admin_code or api_handler_code are NOT related to the bug, output them BYTE-FOR-BYTE identical to the current code in your context. Do NOT regenerate them. Do NOT "clean them up". Copy. Paste. Done.
6. **VERIFY your fix mentally** by replaying the broken path with the fix applied. Does it work now?
7. **EXPLAIN the fix precisely**: name the specific function and the specific change. Example: "handleSave was missing await on insert(), so the function returned before the row was written. Added await on line 47. Nothing else changed."

⛔ FORBIDDEN in bug fix mode:
- Refactoring code that wasn't broken
- Renaming variables, functions, components, or files
- Restyling, recoloring, or rearranging the layout
- Changing colors, fonts, spacing, or className strings
- Reordering or consolidating imports
- Adding new features the user didn't ask for
- Rebuilding the whole component "to be cleaner"
- Rewriting unrelated files when only one file has the bug
- Regenerating admin_code or api_handler_code if the bug is in page_code

If you find yourself wanting to refactor, restyle, rename, or "improve" anything — STOP. The user did not ask for that. They asked for ONE thing to be fixed. If you change ANYTHING outside the minimum fix area, you have failed the task.

The user reported ONE specific problem. Solve THAT problem. Nothing more.`;
