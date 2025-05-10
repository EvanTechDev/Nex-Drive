import { NextResponse } from "next/server"

// Increase the body parser size limit
export const config = {
  api: {
    bodyParser: false,
    responseLimit: "50mb",
  },
}

export async function POST(request: Request) {
  console.log("Upload API called")

  try {
    // Parse the form data
    const formData = await request.formData()
    console.log("Form data parsed")

    const userId = formData.get("userId") as string
    const path = formData.get("path") as string
    const files = formData.getAll("files") as File[]

    console.log(`Upload request received - userId: ${userId}, path: ${path}, files count: ${files.length}`)

    if (!userId || !path || !files.length) {
      console.log("Missing required parameters")
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Log file details
    files.forEach((file, index) => {
      console.log(`File ${index + 1}: ${file.name}, size: ${file.size}, type: ${file.type}`)
    })

    try {
      // First ensure the directory exists
      console.log(`Ensuring directory exists: ${path}`)
      const folderId = await ensureDirectoryPath(path)

      if (!folderId) {
        console.log("Failed to find or create directory")
        return NextResponse.json({ error: "Failed to find or create directory" }, { status: 500 })
      }

      console.log(`Directory found/created with ID: ${folderId}`)

      // Upload the files one by one
      const results = []
      for (const file of files) {
        try {
          console.log(`Starting upload for file: ${file.name}`)
          const result = await uploadFileToMisskey(folderId, file)
          console.log(`Upload successful for file: ${file.name}`, result)

          results.push({
            success: true,
            fileName: file.name,
            fileId: result.id || "unknown",
            message: "File uploaded successfully",
          })
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error)
          results.push({
            success: false,
            fileName: file.name,
            error: error instanceof Error ? error.message : "Upload failed",
          })
        }
      }

      // Return detailed results
      return NextResponse.json({
        success: results.some((r) => r.success),
        message: `${results.filter((r) => r.success).length} of ${files.length} files uploaded successfully`,
        results,
      })
    } catch (error) {
      console.error("Error in upload process:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to upload files" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error parsing request:", error)
    return NextResponse.json({ error: "Error parsing request" }, { status: 500 })
  }
}

// Function to ensure a directory path exists
async function ensureDirectoryPath(path: string) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  console.log(`Ensuring directory path exists: ${path}`)

  // Split the path into components
  const pathComponents = path.split("/").filter(Boolean)
  console.log("Path components:", pathComponents)

  let currentFolderId: string | null = null

  // Traverse the path and create directories as needed
  for (const component of pathComponents) {
    try {
      // First, try to find the directory
      console.log(`Looking for directory: ${component} under parent: ${currentFolderId || "root"}`)

      const findResponse = await fetch(`${apiUrl}/api/drive/folders/find`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          i: apiKey,
          name: component,
          parentId: currentFolderId,
        }),
      })

      // Log the raw response for debugging
      const responseText = await findResponse.text()
      console.log(`Raw find response for ${component}:`, responseText)

      let findData
      try {
        findData = JSON.parse(responseText)
        console.log(`Parsed find response for ${component}:`, findData)
      } catch (e) {
        console.error(`Failed to parse JSON for ${component}:`, e)
        throw new Error(
          `Invalid response from server when finding folder ${component}: ${responseText.substring(0, 100)}`,
        )
      }

      // Check if we found the folder
      if (findResponse.ok && Array.isArray(findData) && findData.length > 0) {
        // Find the exact folder match
        const folder = findData.find((f) => f.name === component)
        if (folder) {
          currentFolderId = folder.id
          console.log(`Found existing folder ${component} with ID: ${currentFolderId}`)
          continue
        }
      }

      // If not found, create the folder
      console.log(`Creating directory: ${component} (parent: ${currentFolderId || "root"})`)
      const createResponse = await fetch(`${apiUrl}/api/drive/folders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          i: apiKey,
          name: component,
          parentId: currentFolderId,
        }),
      })

      // Log the raw response for debugging
      const createResponseText = await createResponse.text()
      console.log(`Raw create response for ${component}:`, createResponseText)

      if (!createResponse.ok) {
        console.error(`Error creating directory ${component}: Status ${createResponse.status}`)
        throw new Error(`Failed to create directory ${component}: ${createResponseText.substring(0, 100)}`)
      }

      let createData
      try {
        createData = JSON.parse(createResponseText)
        console.log(`Created directory ${component}:`, createData)
      } catch (e) {
        console.error(`Failed to parse JSON for created folder ${component}:`, e)
        throw new Error(
          `Invalid response from server when creating folder ${component}: ${createResponseText.substring(0, 100)}`,
        )
      }

      currentFolderId = createData.id
    } catch (error) {
      console.error(`Error processing directory ${component}:`, error)
      throw new Error(
        `Failed to process directory ${component}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return currentFolderId
}

// Function to upload a file to MISSKEY drive
async function uploadFileToMisskey(folderId: string, file: File) {
  const apiUrl = process.env.MISSKEY_API_URL
  const apiKey = process.env.MISSKEY_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error("MISSKEY API configuration is missing")
  }

  console.log(`Preparing to upload file ${file.name} (${file.size} bytes) to folder ${folderId}`)

  // Create a new FormData instance for the file upload
  const formData = new FormData()
  formData.append("i", apiKey)
  formData.append("file", file)
  formData.append("folderId", folderId)

  try {
    console.log(`Sending upload request for ${file.name} to ${apiUrl}/api/drive/files/create`)

    // Upload the file
    const response = await fetch(`${apiUrl}/api/drive/files/create`, {
      method: "POST",
      body: formData,
    })

    // Get the response text for debugging
    const responseText = await response.text()
    console.log(`Raw upload response for ${file.name}:`, responseText)

    // Check if the response is ok
    if (!response.ok) {
      console.error(`Upload failed with status ${response.status} for file ${file.name}`)
      throw new Error(`Upload failed with status ${response.status}: ${responseText.substring(0, 100)}`)
    }

    // Try to parse the successful response
    try {
      const jsonResult = JSON.parse(responseText)
      console.log(`Successfully uploaded file ${file.name}:`, jsonResult)

      if (!jsonResult.id) {
        console.warn(`Upload response for ${file.name} missing ID field:`, jsonResult)
      }

      return jsonResult
    } catch (jsonError) {
      console.error(`Response is not valid JSON for ${file.name}:`, jsonError)

      // If we can't parse JSON but the response was successful, return a basic success object
      return {
        success: true,
        name: file.name,
        id: `unknown-${Date.now()}`, // Generate a temporary ID
        message: "File uploaded but response could not be parsed as JSON",
        rawResponse: responseText.substring(0, 100),
      }
    }
  } catch (error) {
    console.error(`Error in uploadFileToMisskey for ${file.name}:`, error)
    throw error
  }
}
