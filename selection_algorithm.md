# Student Selection Algorithm: A Comprehensive Technical Reference

This document provides a complete and detailed explanation of the student selection algorithm and its associated logic within the Smart Teacher's Assistant application. It is intended to serve as a definitive reference to prevent regressions and guide future development.

## 1. Core Philosophy

The system is designed to be both **fair** and **transparent**. Fairness is achieved through a multi-level selection algorithm that prioritizes students who have had fewer opportunities. Transparency is achieved by including all students in every selection round and providing clear visual feedback and statistics for every outcome.

## 2. The Selection Pool: Universal Inclusivity

A foundational rule of the algorithm is that **all students in the class are included in the selection pool for every round**, regardless of their attendance status ("present" or "absent").

This ensures that every student has a statistical chance of being selected, reinforcing the concept that an absence results in a *missed opportunity*.

## 3. The Multi-Level Selection Algorithm

When the "Select Student" button is clicked for a specific category, the algorithm follows a strict, three-step process to determine the winner:

### Step 1: Primary Filter (Lowest Count in Current Category)
The algorithm first identifies the group of students who have been selected the *least number of times* specifically for the **current category**.

*   **Example:** If selecting for "Grammar," the system finds the minimum selection count for "Grammar" among all students (e.g., 3 times). It then creates a pool of candidates who have all been selected for "Grammar" exactly 3 times.

If this filter results in a single, unique student, that student is declared the winner, and the process stops here.

### Step 2: First Tie-Breaker (Lowest Total Count in Other Categories)
If the primary filter results in a tie (i.e., multiple students have the same lowest count for the current category), a tie-breaker is initiated.

The algorithm calculates the **sum of selection counts for each tied student across all *other* categories**. The student with the lowest total in these other categories is selected.

**Crucial Detail:** This calculation is based on the student's **entire history** in the class (across all sessions), not just the counts from the active session. This provides a long-term memory for fairness.

*   **Example:** Students A and B are tied for "Grammar" selections.
    *   Student A's counts in other categories: Vocabulary (5) + Speaking (4) = 9
    *   Student B's counts in other categories: Vocabulary (2) + Speaking (3) = 5
    *   Student B wins the tie-breaker because their total count in other categories is lower.

If this tie-breaker results in a single, unique winner, the process stops here.

### Step 3: Final Tie-Breaker (Random Selection)
If the first tie-breaker also results in a tie (i.e., multiple students have the same lowest count in the current category AND the same total count in all other categories), the algorithm performs a **random selection** from this final, tied group.

This ensures that even in a perfect tie, the selection remains fair and unpredictable.

## 4. Post-Selection Logic and Counter Management

After a winner is selected, a series of checks and actions are performed.

### 4.1. Handling an Absent Winner
If the selected student is marked as **"غایب" (Absent)**:
1.  Their **"فرصت از دست رفته" (Missed Chance)** counter is immediately **incremented by 1**.
2.  The UI displays their name with a **strikethrough and reduced opacity** to visually signal their absence.
3.  The **"غایب" (Absent)** button next to their name is displayed in its "active" state.

### 4.2. Handling a Winner with a "Problem"
If the selected student was already marked as **"مشکل" (Problem)** *before* the selection:
1.  Their **"مشکل" (Problem)** counter is **incremented by 1**.
2.  Their **"فرصت از دست رفته" (Missed Chance)** counter is also **incremented by 1**.

### 4.3. Manual Status Changes on the Selection Page
The "غایب" (Absent) and "مشکل" (Problem) buttons next to the selected student's name have specific, mutually exclusive behaviors:

*   **Activating "غایب" (Absent):**
    *   Increments **"فرصت از دست رفته"** by 1.
    *   If the "مشکل" button was active, it is deactivated, and its associated counters ("مشکل" and "فرصت از دست رفته") are decremented.

*   **Activating "مشکل" (Problem):**
    *   Increments **"مشکل"** by 1.
    *   Increments **"فرصت از دست رفته"** by 1.
    *   If the "غایب" button was active, it is deactivated, and its associated "فرصت از دست رفته" counter is decremented.

*   **Deactivating a Status:**
    *   Deactivating either button correctly reverses the specific counter changes associated with it.

### 4.4. Counter Safeguard (Zero-Floor Rule)
A critical safeguard is in place for all counter decrements. **The "مشکل" and "فرصت از دست رفته" counters can never go below zero.** If a decrement operation would result in a negative number, the counter's value is set to **0** instead. This prevents logical errors and ensures data integrity.

---

This detailed breakdown should serve as the canonical reference for the student selection logic.