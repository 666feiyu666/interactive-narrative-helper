[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$rulesV10 = Join-Path $repositoryRoot 'tools\knowledge\coding-rules.mjs'
$rulesV11 = Join-Path $repositoryRoot 'tools\knowledge\coding-rules-v1.1.mjs'
$workbookPathContract = Join-Path $repositoryRoot 'tools\knowledge\track-a-workbook-path.mjs'
$builderV10 = Join-Path $repositoryRoot 'tools\knowledge\build-track-a-knowledge.mjs'
$builderV11 = Join-Path $repositoryRoot 'tools\knowledge\build-track-a-knowledge-v1.1.mjs'
$profile = Join-Path $repositoryRoot 'tools\knowledge\profile-track-a-workbook.mjs'
$testsV10 = Join-Path $repositoryRoot 'tests\knowledge\coding-rules.test.mjs'
$testsV11 = Join-Path $repositoryRoot 'tests\knowledge\coding-rules-v1.1.test.mjs'
$workbookPathTests = Join-Path $repositoryRoot 'tests\knowledge\canonical-workbook-path.test.mjs'
$releaseTests = Join-Path $repositoryRoot 'tests\knowledge\release-artifacts.test.mjs'

foreach ($script in @($rulesV10, $rulesV11, $workbookPathContract, $builderV10, $builderV11, $profile, $testsV10, $testsV11, $workbookPathTests, $releaseTests)) {
    & node --check $script
    if ($LASTEXITCODE -ne 0) {
        throw "Syntax validation failed: $script"
    }
}

& node --test $testsV10 $testsV11 $workbookPathTests $releaseTests
if ($LASTEXITCODE -ne 0) {
    throw 'Track A coding-rule tests failed.'
}

Write-Output 'PASS: Track A coding rules and knowledge-build tooling'
