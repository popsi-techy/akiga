---
"@akiga/design-system-app": minor
---

Attribute mapping gains **Termination date** under the System source, and a date read from an
HR system has to say how it is written.

`04/03/2026` is the fourth of March or the third of April depending on who sent it. Every
other attribute in this table is a string IGA passes through; a date is a string that has to
parse, and guessing wrong on this one produces a leaver date months out — on the single
attribute where being wrong revokes the wrong person's access, or fails to revoke the right
one's.

So picking Termination date reveals a format field, and the row is not complete without it:
`mappingComplete` now requires a format for any attribute in `DATE_ATTRIBUTES`, so Save stops
on the Mapping tab rather than writing a mapping that will misread on the first sync.

**The format sits beside the attribute, inside its cell.** A date's format is part of reading
that attribute, so it belongs to the attribute — not stacked underneath it, and not in the
Transformation column next door. Borrowing that column did work, since a date row can never
carry an expression, but it put a date pattern under a header saying Transformation and spent
a column the row still advertises.

**The column widens to hold both, and only when a date is in the table.** Measured: the
select needs 155 to show "Termination date" whole (109 of text, 46 of padding and arrow) and
the format needs 112 for `dd/MM/yyyy` (84 and 28), so the cell needs 275 against the 170 it
had. Shrinking the select to fit inside 170 instead would render the value you just picked as
"Termination d…", in the column the row is read by. Tables with no date keep the narrower
column, so nothing moves for a mapping that does not have one.

**The drawer went 1040 → 1160 to hold that.** 805 of columns plus the pane's 48 of padding
and the rail's 288 comes to 1141; at 1040 the table would have scrolled sideways inside a
drawer that does not otherwise scroll — the defect this table already had once, from a
min-width larger than the pane it sat in. Every other tab gains the 120 as slack, and the
response split takes it without being told, being a flexible column against a fixed preview.

**The pattern reads itself back.** The helper says what the field does before there is anything
in it ("Column format check"), then renders what you typed against one fixed instant —
`dd/MM/yyyy` →
`e.g. 09/03/2026`, `yyyy-MM-dd` → `e.g. 2026-03-09`, `dd-MMM-yyyy` → `e.g. 09-Mar-2026`. Every
field of the sample is a different number (March, the 9th, 17:04:05) so no token can look
right by coincidence, which is the only way to be sure which of the two readings you asked
for before a sync tells you. Tokens: `yyyy yy MMMM MMM MM dd HH mm ss`. An info icon on the
field carries the why — IGA checks the column against this pattern on sync and skips
updating the field when it does not match — without a permanent paragraph under every date
row.

The format belongs to the date, so changing the attribute clears it rather than leaving a
saved value nothing reads.

`startDate` under custom-user is the obvious next member of `DATE_ATTRIBUTES`. It is not
there yet, because making a field required on an attribute people have already mapped would
turn finished rows incomplete.

**One defect this surfaced.** The IGA attribute select showed "Pick one or write an
expression." whenever the row was unfinished — which used to mean the same thing as "nothing
is selected". Now that a row can be unfinished for having no date format, the select was
telling you to pick an attribute you had already picked, with the real error underneath it.
It now fires only when there is genuinely no attribute and no expression.
