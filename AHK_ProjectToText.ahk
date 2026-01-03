#SingleInstance Force   ; Prevent multiple instances of the script from running
#NoEnv                  ; Avoid checking empty variables against environment variables
SendMode Input          ; Use the recommended input mode for reliability

; =================================================================
; CONFIGURATION SECTION
; =================================================================
DestinationFolder := "D:\ILI\My Student-Picker App Summer 1404\Student-Picker-App-Data-Backup\ForNotebookLLM"
; This is where the final combined output file will be written.
; The script ensures the folder exists before writing.

FileList =
(
C:\Documents\GitHub\student-picker\index.html
C:\Documents\GitHub\student-picker\src\logManager.js
C:\Documents\GitHub\student-picker\src\main.js
C:\Documents\GitHub\student-picker\src\models.js
C:\Documents\GitHub\student-picker\src\state.js
C:\Documents\GitHub\student-picker\src\style.css
C:\Documents\GitHub\student-picker\src\ui.js
C:\Documents\GitHub\student-picker\src\utils.js
C:\Documents\GitHub\student-picker\src\compression.worker.js
C:\Documents\GitHub\student-picker\src\db.js
C:\Documents\GitHub\student-picker\GEMINI.md
C:\Documents\GitHub\student-picker\package.json
C:\Documents\GitHub\student-picker\src\developer.js
C:\Documents\GitHub\student-picker\src\testclass.js
C:\Documents\GitHub\student-picker\src\keyboard.js
C:\Documents\GitHub\student-picker\src\backfill.js
C:\Documents\GitHub\student-picker\src\reports.js
C:\Documents\GitHub\student-picker\src\backup.js
C:\Documents\GitHub\student-picker\src\screensaver.js
C:\Documents\GitHub\student-picker\src\demo.js
)

; =================================================================
; HOTKEY ASSIGNMENT
; =================================================================
^!c::                     ; Ctrl+Alt+C triggers the merge process
    Gosub, RunFileAutomation
return

; =================================================================
; MAIN FUNCTION: MERGE ENGINE
; =================================================================
RunFileAutomation:
    ; Ensure destination folder exists
    IfNotExist, %DestinationFolder%
        FileCreateDir, %DestinationFolder%

    ; Define output file path
    outputFile := DestinationFolder "\Project-student-picker-all-files-combined.txt"

    ; Open output file in write mode (LF-only, no CRLF translation)
    file := FileOpen(outputFile, "w")

    ; -----------------------------------------------------------------
    ; Write disclaimer at top of combined file
    ; -----------------------------------------------------------------
    disclaimer := "=== NOTICE ===`nThis text file is a combination of all the project files into one.`nEach section begins with a clear header showing the ORIGINAL file name and extension, making it convenient for searching and locating each file.`n=================`n"
    file.Write(disclaimer)

    ; -----------------------------------------------------------------
    ; Append numbered table of contents
    ; -----------------------------------------------------------------
    file.Write("`nTABLE OF CONTENTS:`n")
    index := 0
    Loop, Parse, FileList, `n, `r
    {
        if (A_LoopField = "")
            continue
        index++
        SplitPath, A_LoopField, OutFileName
        file.Write(index ". " OutFileName "`n")
    }
    file.Write("=================`n")

    ; -----------------------------------------------------------------
    ; Loop through each file in FileList and merge contents
    ; -----------------------------------------------------------------
    index := 0
    Loop, Parse, FileList, `n, `r
    {
        OriginalFullPath := A_LoopField
        if (OriginalFullPath = "")
            continue

        ; Skip missing files with warning
        IfNotExist, %OriginalFullPath%
        {
            MsgBox, 48, Warning, File not found (skipping):`n%OriginalFullPath%
            continue
        }

        ; Increment section number
        index++

        ; Extract original filename (with extension)
        SplitPath, OriginalFullPath, OutFileName

        ; Read file contents
        FileRead, fileContent, %OriginalFullPath%

        ; Normalize line endings to LF only
        StringReplace, fileContent, fileContent, `r`n, `n, All
        StringReplace, fileContent, fileContent, `r, , All

        ; Header with number + filename
        file.Write("`n=========== " index ". " OutFileName " ===========`n")

        ; File contents
        file.Write(fileContent)

        ; Separator with number + filename
        file.Write("`n-------- END OF " index ". " OutFileName " --------`n")
    }

    ; Close output file
    file.Close()

    ; Final confirmation message
    MsgBox, 64, Process Complete, All listed files have been merged directly into Project-student-picker-all-files-combined.txt with LF-only line endings. Headers, separators, and a numbered table of contents show the original filenames with extensions.
return