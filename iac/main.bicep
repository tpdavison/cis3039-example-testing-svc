targetScope = 'resourceGroup'

@description('Globally unique Function App name, for example products-test-ab47-func.')
@minLength(2)
@maxLength(60)
param functionAppName string

@description('Globally unique Storage Account name: 3–24 lowercase letters and digits, for example productstestab47store.')
@minLength(3)
@maxLength(24)
param storageAccountName string

@description('A permitted Azure region that supports Windows Consumption Functions. Defaults to the resource group location.')
param location string = resourceGroup().location

resource storageAccount 'Microsoft.Storage/storageAccounts@2025-06-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    // Required by the connection strings used for Functions host and content storage.
    allowSharedKeyAccess: true
  }
}

var storageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'

resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  properties: {
    reserved: false
    httpsOnly: true
    // Omit serverFarmId so Azure creates or selects the Windows Consumption plan.
    siteConfig: {
      use32BitWorkerProcess: false
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~22'
        }
        {
          name: 'AzureWebJobsStorage'
          value: storageConnectionString
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: storageConnectionString
        }
        // Azure generates the content share name when WEBSITE_CONTENTSHARE is omitted.
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ]
    }
  }
}

// The GitHub Actions workflow authenticates with a publishing profile over HTTPS.
resource scmPublishingPolicy 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2024-04-01' = {
  parent: functionApp
  name: 'scm'
  properties: {
    allow: true
  }
}

resource ftpPublishingPolicy 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2024-04-01' = {
  parent: functionApp
  name: 'ftp'
  properties: {
    allow: false
  }
}

// Outputs contain resource identifiers and public URLs, never credentials.
output deployedFunctionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output hostingPlanId string = functionApp.properties.serverFarmId
