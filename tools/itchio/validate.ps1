[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runnerPath = Join-Path $repositoryRoot 'tools\itchio\capture-visible-text.mjs'
$cleanerPath = Join-Path $repositoryRoot 'tools\itchio\clean-page-bundles.mjs'
$testPath = Join-Path $repositoryRoot 'tests\itchio\capture-visible-text.test.mjs'
$cleanerTestPath = Join-Path $repositoryRoot 'tests\itchio\clean-page-bundles.test.mjs'

& node --check $runnerPath
if ($LASTEXITCODE -ne 0) {
    throw 'Node syntax validation failed.'
}
Write-Output 'PASS: capture tool syntax'

& node --check $cleanerPath
if ($LASTEXITCODE -ne 0) {
    throw 'Node cleaner syntax validation failed.'
}
Write-Output 'PASS: offline cleaner syntax'

& node --test $testPath $cleanerTestPath
if ($LASTEXITCODE -ne 0) {
    throw 'itch.io tool tests failed.'
}
Write-Output 'PASS: itch.io tool tests'

$ignoredProbes = @(
    'corpus/restricted-sources/itchio-public-text/runs/probe/raw-visible-text.txt',
    'corpus/restricted-sources/itchio-public-text/runs/probe/page-structure.json',
    'corpus/restricted-sources/itchio-public-text/runs/probe/rendered-page.html',
    'corpus/restricted-sources/itchio-public-text/derived/probe/projects/itchio-0001/record.json',
    'corpus/restricted-sources/itchio-public-text/derived/probe/projects/itchio-0001/description-clean.txt'
)
foreach ($ignoredProbe in $ignoredProbes) {
    & git -C $repositoryRoot check-ignore --quiet -- $ignoredProbe
    if ($LASTEXITCODE -ne 0) {
        throw "Restricted-source output is not ignored by Git: $ignoredProbe"
    }
}
Write-Output 'PASS: restricted source and derived outputs are ignored by Git'
