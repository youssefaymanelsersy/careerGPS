# CareerGPS × FrontEnd Team & BackEnd Team — API Contract
 
**Version:** 1.1.0  
**Last Updated:** 2026-06-18  
**Status:** Draft — pending AI Team confirmation
 
---

# Table of Contents
* [CV tRPC API Documentation](#cv-trpc-api-documentation)

---

# CV tRPC API Documentation

## Overview

The `cv` router provides all client-side operations related to the user's uploaded CV.

* All procedures require authentication.
* A user can have multiple uploaded CVs.
* Most operations work on a specific `cvId`.

---

# Status Lifecycle

A CV goes through the following states:

```text
pending
    ↓
parsing
    ↓
completed
```

or

```text
pending
    ↓
parsing
    ↓
failed
```

| Status      | Description                                                         |
| ----------- | ------------------------------------------------------------------- |
| `pending`   | CV uploaded successfully and waiting for AI processing.             |
| `parsing`   | AI is currently processing the CV.                                  |
| `completed` | Processing completed successfully. Parsed data is available.        |
| `failed`    | Processing failed. `errorMessage` contains the reason if available. |

---

# 1. cv.getStatus

Returns the current processing status of a CV.

## Input

```ts
{
  cvId: string; // UUID
}
```

## Response

```ts
{
  status: "pending" | "parsing" | "completed" | "failed";
  errorMessage: string | null;
}
```

### Frontend Usage

Use this procedure for polling after uploading a CV.

Polling should stop when:

* `status === "completed"`
* `status === "failed"`

### Possible Errors

| Error Code  | Description                 |
| ----------- | --------------------------- |
| `NOT_FOUND` | CV does not exist.          |
| `FORBIDDEN` | CV belongs to another user. |

---

# 2. cv.getCV

Returns the latest uploaded CV for the authenticated user.

## Input

None.

## Response

```ts
{
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  status: "pending" | "parsing" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}
```

### Notes

* Returns only the latest uploaded CV.
* Returns metadata only.
* Does **not** return parsed CV information.

### Possible Errors

| Error Code  | Description                   |
| ----------- | ----------------------------- |
| `NOT_FOUND` | User has not uploaded any CV. |

---

# 3. cv.getParsedData

Returns the parsed CV information.

## Input

```ts
{
  cvId: string; // UUID
}
```

## Response

```ts
{
  parsedData: ParsedCVData;
}
```

### Notes

This procedure can only be called after:

```text
status === "completed"
```

If parsing has not finished yet, the procedure returns:

```text
PRECONDITION_FAILED
```

### Possible Errors

| Error Code            | Description                          |
| --------------------- | ------------------------------------ |
| `NOT_FOUND`           | CV does not exist.                   |
| `FORBIDDEN`           | CV belongs to another user.          |
| `PRECONDITION_FAILED` | CV processing has not completed yet. |

---

# 4. cv.deleteCV

Deletes a CV permanently.

This operation:

* Deletes the file from Cloudinary.
* Deletes the database record.

## Input

```ts
{
  cvId: string; // UUID
}
```

## Response

```ts
{
  success: true;
}
```

### Possible Errors

| Error Code              | Description                                   |
| ----------------------- | --------------------------------------------- |
| `NOT_FOUND`             | CV does not exist.                            |
| `FORBIDDEN`             | CV belongs to another user.                   |
| `INTERNAL_SERVER_ERROR` | Failed to delete the file or database record. |

---

# ParsedCVData

```ts
interface ParsedCVData {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;

  skills: {
    technical: { name: string; level: string | null }[];
    nonTechnical: { name: string; level: string | null }[];
  };

  experience: Experience[];

  projects: {
    name: string | null;
    description: string | null;
    technologies: string[];
    url: string | null;
    startDate: string | null;
    endDate: string | null;
  }[];

  education: {
    institution: string;
    degree: string | null;
    field: string | null;
    major: string | null;
    startDate: string | null;
    endDate: string | null;
  }[];

  certifications: {
    name: string | null;
    issuer: string | null;
    date: string | null;
  }[];

  languages: string[];

  links: {
    github: string | null;
    linkedin: string | null;
    portfolio: string | null;
  };

  
}
```

---

# Recommended Frontend Flow

## 1. Upload

Call the REST upload endpoint.

Example response:

```ts
{
  cvId: string;
}
```

Store the returned `cvId`.

---

## 2. Poll Status

```ts
const { data } = trpc.cv.getStatus.useQuery(
  { cvId },
  {
    refetchInterval: (data) =>
      data?.status === "completed" || data?.status === "failed"
        ? false
        : 3000,
  }
);
```

---

## 3. Handle Result

| Status      | Frontend Action                             |
| ----------- | ------------------------------------------- |
| `pending`   | Continue polling.                           |
| `parsing`   | Continue polling.                           |
| `completed` | Stop polling and call `cv.getParsedData()`. |
| `failed`    | Stop polling and display `errorMessage`.    |

---

# Error Handling

| Procedure       | Possible Error Codes                              |
| --------------- | ------------------------------------------------- |
| `getStatus`     | `NOT_FOUND`, `FORBIDDEN`                          |
| `getCV`         | `NOT_FOUND`                                       |
| `getParsedData` | `NOT_FOUND`, `FORBIDDEN`, `PRECONDITION_FAILED`   |
| `deleteCV`      | `NOT_FOUND`, `FORBIDDEN`, `INTERNAL_SERVER_ERROR` |
