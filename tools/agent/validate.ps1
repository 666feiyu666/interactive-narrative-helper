[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$boundaryTest = Join-Path $repositoryRoot 'tests\agent\component-boundaries.test.mjs'
$schemaTest = Join-Path $repositoryRoot 'tests\agent\schema-contracts.test.mjs'
$validator = Join-Path $repositoryRoot 'tests\helpers\schema-fixture-validator.mjs'

& node --check $validator
if ($LASTEXITCODE -ne 0) {
    throw 'Schema fixture validator syntax validation failed.'
}

& node --check $boundaryTest
if ($LASTEXITCODE -ne 0) {
    throw 'Agent boundary test syntax validation failed.'
}

& node --check $schemaTest
if ($LASTEXITCODE -ne 0) {
    throw 'Agent schema test syntax validation failed.'
}

& node --test $boundaryTest $schemaTest
if ($LASTEXITCODE -ne 0) {
    throw 'Agent boundary or schema tests failed.'
}

Write-Output 'PASS: active Track A component and preserved Track B narrative-technique boundary'
