# Quotation Assistant System Architecture Report

## Executive Summary

The Quotation Assistant is a serverless cloud-native application built on AWS that automates product catalog management and quotation generation. The system processes product catalogs (PDFs), price lists (Excel), and sales drawings, extracts product information using AI/ML services, and enables intelligent product search and quotation management.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AWS Amplify (Frontend)                          │
│                    React.js Web Application (SPA)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ File Upload  │  │ Product      │  │ Quotation    │                 │
│  │ & Review    │  │ Search       │  │ Management   │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (API Gateway)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ File          │   │ Product      │   │ Quotation     │
│ Ingestion     │   │ Search API   │   │ Management    │
│ Service       │   │              │   │ Service       │
│ (Lambda)      │   │ (Lambda)     │   │ (Lambda)      │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                    AWS Services                      │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   S3 Bucket  │  │  DynamoDB    │  │  Textract  │ │
│  │ (hb-files-   │  │  Tables:     │  │  (PDF OCR) │ │
│  │   raw)       │  │  - Files     │  │            │ │
│  │              │  │  - Products  │  │            │ │
│  │              │  │  - Catalog  │  │            │ │
│  │              │  │  - PriceList│  │            │ │
│  │              │  │  - Quotations│ │            │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Qdrant      │  │  AWS Bedrock │  │  AWS SES   │ │
│  │  (Vector DB) │  │  (Embeddings)│  │  (Email)   │ │
│  │              │  │              │  │            │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  Cognito     │  │  Secrets     │                 │
│  │  (Auth)      │  │  Manager     │                 │
│  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. File Ingestion Service
**Purpose**: Process uploaded files (PDFs, Excel) and extract product information

**Key Functions**:
- **getPresignedUrl**: Generate S3 presigned URLs for secure file uploads
- **processUploadedFile**: Triggered by S3 events, processes files through AWS Textract
- **getFiles**: List and retrieve file metadata
- **Product Extraction**: Extract products from catalogs (PDF) and price lists (Excel)

**Technologies**:
- AWS Lambda (Python 3.11)
- AWS Textract (PDF OCR and table extraction)
- DynamoDB (File metadata, extracted products)
- S3 (Raw file storage)

**Data Flow**:
1. User uploads file → Presigned URL → S3
2. S3 event triggers Lambda
3. Textract analyzes PDF/Excel
4. Products extracted and stored in DynamoDB
5. Status updates tracked in Files table

### 2. Product Search API
**Purpose**: Provide intelligent product search using vector embeddings

**Key Functions**:
- **searchIndexer**: DynamoDB Stream handler that indexes products into Qdrant
- **searchApi**: Vector similarity search, autocomplete, batch search
- **Reranking**: OpenAI-based relevance scoring

**Technologies**:
- AWS Lambda (Python 3.11)
- Qdrant Cloud (Vector database)
- AWS Bedrock (Amazon Titan embeddings - 1536 dimensions)
- DynamoDB Streams (Real-time indexing)
- OpenAI API (Optional re-ranking)

**Data Flow**:
1. Product saved to DynamoDB → Stream event
2. Lambda generates embedding via Bedrock
3. Product indexed in Qdrant with vector
4. Search queries generate embeddings and query Qdrant
5. Results re-ranked by OpenAI (optional)

### 3. Quotation Management Service
**Purpose**: Manage quotations, line items, pricing, and exports

**Key Functions**:
- **quotationApi**: CRUD operations for quotations
- **Line Items**: Add/update/delete quotation lines
- **Price Calculation**: Apply margins, refresh prices
- **Exports**: Generate Excel exports (stock check, priority import)
- **Email**: Draft and send quotation emails via SES

**Technologies**:
- AWS Lambda (Python 3.11)
- DynamoDB (Quotations table with GSI on status/created_at)
- AWS SES (Email delivery)
- S3 (Read-only access for sales drawings)

---

## Technology Stack

### Frontend
- **Framework**: React 18.2 with TypeScript
- **Deployment**: AWS Amplify
- **Authentication**: AWS Cognito (JWT)
- **PDF Viewer**: react-pdf (PDF.js)
- **Excel Processing**: xlsx library

### Backend Services
- **Runtime**: Python 3.11
- **Framework**: Serverless Framework v3
- **API Gateway**: HTTP API (REST)
- **Compute**: AWS Lambda (serverless functions)
- **Storage**: 
  - DynamoDB (NoSQL, pay-per-request)
  - S3 (Object storage)
  - Qdrant Cloud (Vector database)

### AI/ML Services
- **AWS Textract**: Document analysis, table extraction
- **AWS Bedrock**: Amazon Titan Embed Text v1 (1536-dim vectors)
- **OpenAI API**: Optional re-ranking for search results

### Infrastructure
- **Region**: us-east-1
- **Authentication**: AWS Cognito User Pools
- **Secrets**: AWS Secrets Manager
- **Monitoring**: CloudWatch Logs
- **CORS**: Configured for localhost and production domains

---

## Data Architecture

### DynamoDB Tables

1. **hb-files** (Primary Key: fileId)
   - Stores file metadata, upload status, processing stages

2. **hb-catalog-products** (Composite Key: fileId + chunkIndex)
   - Chunked storage of products extracted from PDF catalogs
   - Supports large catalogs via pagination

3. **hb-pricelist-products** (Composite Key: fileId + chunkIndex)
   - Chunked storage of products from Excel price lists

4. **hb-products** (Primary Key: orderingNumber, GSI: productCategory)
   - Master product catalog
   - Stream enabled for real-time indexing to Qdrant

5. **quotations** (Primary Key: quotationId, GSI: status, created_at)
   - Quotation documents with line items and metadata

### Vector Database (Qdrant)
- **Collection**: products
- **Vector Size**: 1536 (Amazon Titan)
- **Distance Metric**: Cosine similarity
- **Metadata**: Product ordering numbers, categories, descriptions

---

## Key Workflows

### File Processing Workflow
```
User Upload → S3 (Presigned URL)
    ↓
S3 Event → Lambda Trigger
    ↓
Textract Analysis (PDF) or Excel Parsing
    ↓
Product Extraction
    ↓
Save to DynamoDB (Catalog/PriceList tables)
    ↓
User Review & Approval
    ↓
Save to Master Products Table
    ↓
DynamoDB Stream → Index to Qdrant
```

### Product Search Workflow
```
User Query → Search API
    ↓
Generate Embedding (Bedrock)
    ↓
Vector Search (Qdrant)
    ↓
Optional: Re-rank (OpenAI)
    ↓
Return Results with Relevance Scores
```

### Quotation Creation Workflow
```
Create Quotation → DynamoDB
    ↓
Add Line Items (Search Products)
    ↓
Calculate Prices (Apply Margins)
    ↓
Generate Export (Excel)
    ↓
Send Email (SES)
```

---

## Security & Authentication

- **Authentication**: AWS Cognito JWT tokens
- **Authorization**: API Gateway JWT authorizers
- **API Keys**: Stored in AWS Secrets Manager
- **CORS**: Configured for specific origins
- **IAM Roles**: Least-privilege access per service
- **S3**: Presigned URLs for secure uploads/downloads

---

## Scalability & Performance

- **Serverless**: Auto-scaling Lambda functions
- **DynamoDB**: Pay-per-request billing, no capacity planning
- **Vector Search**: Qdrant Cloud handles high-throughput queries
- **Caching**: CloudFront (via Amplify) for static assets
- **Timeouts**: Extended for large file processing (up to 5 minutes)

---

## Deployment

- **Frontend**: AWS Amplify (automated CI/CD)
- **Backend**: Serverless Framework deployments
- **Environment**: Single-stage deployment (dev/prod via environment variables)
- **Profile**: AWS profile `hb-client` for deployments

---

## Summary

The Quotation Assistant leverages AWS serverless architecture to provide a scalable, cost-effective solution for product catalog management and quotation generation. The system combines document processing (Textract), AI-powered search (Bedrock + Qdrant), and traditional database storage (DynamoDB) to deliver an intelligent product management platform.

**Key Strengths**:
- Fully serverless (no infrastructure management)
- Real-time product indexing via DynamoDB Streams
- Intelligent vector search with semantic understanding
- Automated document processing pipeline
- Scalable architecture supporting large catalogs

