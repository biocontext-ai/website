import { z } from "zod"

/**
 * Sequential thinking tool for step-by-step problem solving
 * This tool is stateless and designed for concurrent multi-user scenarios.
 * All state is maintained client-side and only passed through during tool calls.
 */
export const sequentialThinkingTool = {
  description:
    "Facilitates step-by-step thinking for complex problem-solving. Use this to break down problems into manageable steps and think through them systematically.",
  inputSchema: z.object({
    thought: z.string().describe("The current thinking step or observation"),
    stepNumber: z.number().int().positive().describe("Current step number (1-indexed)"),
    totalSteps: z.number().int().positive().describe("Estimated total steps needed"),
    nextStepNeeded: z.boolean().describe("Whether another step is needed after this one"),
  }),
  execute: async ({
    thought,
    stepNumber,
    totalSteps,
    nextStepNeeded,
  }: {
    thought: string
    stepNumber: number
    totalSteps: number
    nextStepNeeded: boolean
  }) => {
    return {
      success: true,
      stepNumber,
      totalSteps,
      nextStepNeeded,
      thought,
      progressPercentage: Math.round((stepNumber / totalSteps) * 100),
      timestamp: new Date().toISOString(),
    }
  },
}

/**
 * Create TODO list tool
 * Stateless design - returns the complete TODO list structure to be maintained client-side.
 * No server-side storage; all state is ephemeral and in-transit only.
 */
export const createTodoListTool = {
  description:
    "Creates a new TODO list for tracking tasks. Use this to organize work into manageable steps " +
    "that can be checked off as completed. The list state is maintained in the conversation context.",
  inputSchema: z.object({
    title: z.string().describe("Title of the TODO list"),
    items: z.array(z.string()).describe("Initial list of TODO items"),
    description: z.string().optional().describe("Optional description of the TODO list purpose"),
  }),
  execute: async ({ title, items, description }: { title: string; items: string[]; description?: string }) => {
    const listId = `todo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const timestamp = new Date().toISOString()

    const todoList = {
      id: listId,
      title,
      description,
      items: items.map((item, index) => ({
        id: `${listId}-item-${index}`,
        text: item,
        completed: false,
        createdAt: timestamp,
      })),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    // Return complete state - no server-side storage
    return {
      success: true,
      listId: todoList.id,
      title: todoList.title,
      description: todoList.description,
      itemCount: items.length,
      items: todoList.items,
      createdAt: todoList.createdAt,
      updatedAt: todoList.updatedAt,
      message: `Created TODO list "${title}" with ${items.length} items`,
    }
  },
}

/**
 * Set TODO state tool - Update multiple TODO items at once
 * Stateless design - requires current list state as input and returns updated state.
 * The AI model maintains state across the conversation context.
 */
export const setTodoStateTool = {
  description:
    "Updates one or more TODO items in a list. Use this to mark items as completed, update their text, or make multiple changes at once. " +
    "Requires the current TODO list state from previous tool calls.",
  inputSchema: z.object({
    listId: z.string().describe("ID of the TODO list"),
    updates: z
      .array(
        z.object({
          itemId: z.string().describe("ID of the item to update"),
          completed: z.boolean().optional().describe("Mark the item as completed (true) or incomplete (false)"),
          newText: z.string().optional().describe("New text for the item (if updating the content)"),
        }),
      )
      .describe("Array of updates to apply to TODO items"),
    currentState: z
      .object({
        title: z.string(),
        description: z.string().optional(),
        items: z.array(
          z.object({
            id: z.string(),
            text: z.string(),
            completed: z.boolean(),
            createdAt: z.string(),
            completedAt: z.string().optional().nullable(),
          }),
        ),
        createdAt: z.string(),
      })
      .describe("Current state of the TODO list from the most recent tool call"),
  }),
  execute: async ({
    listId,
    updates,
    currentState,
  }: {
    listId: string
    updates: Array<{
      itemId: string
      completed?: boolean
      newText?: string
    }>
    currentState: {
      title: string
      description?: string
      items: Array<{
        id: string
        text: string
        completed: boolean
        createdAt: string
        completedAt?: string | null
      }>
      createdAt: string
    }
  }) => {
    const timestamp = new Date().toISOString()

    // Create a copy of items to update
    const updatedItems = [...currentState.items]
    const updatedItemIds: string[] = []
    const errors: string[] = []

    // Apply all updates
    for (const update of updates) {
      const itemIndex = updatedItems.findIndex((i) => i.id === update.itemId)

      if (itemIndex === -1) {
        errors.push(`Item not found: ${update.itemId}`)
        continue
      }

      const updatedItem = { ...updatedItems[itemIndex] }

      if (update.completed !== undefined) {
        updatedItem.completed = update.completed
        updatedItem.completedAt = update.completed ? timestamp : null
      }

      if (update.newText !== undefined) {
        updatedItem.text = update.newText
      }

      updatedItems[itemIndex] = updatedItem
      updatedItemIds.push(update.itemId)
    }

    const completedCount = updatedItems.filter((i) => i.completed).length
    const totalCount = updatedItems.length

    // Return complete updated state
    return {
      success: errors.length === 0,
      listId,
      title: currentState.title,
      description: currentState.description,
      updatedCount: updatedItemIds.length,
      updatedItemIds,
      errors: errors.length > 0 ? errors : undefined,
      items: updatedItems,
      progress: {
        completed: completedCount,
        total: totalCount,
        percentage: Math.round((completedCount / totalCount) * 100),
      },
      createdAt: currentState.createdAt,
      updatedAt: timestamp,
      message: `Updated ${updatedItemIds.length} item(s)${errors.length > 0 ? ` (${errors.length} error(s))` : ""}`,
    }
  },
}

/**
 * Add TODO item tool
 * Stateless design - requires current list state and returns updated state with new item.
 */
export const addTodoItemTool = {
  description: "Adds a new item to an existing TODO list. Requires the current list state from previous tool calls.",
  inputSchema: z.object({
    listId: z.string().describe("ID of the TODO list"),
    text: z.string().describe("Text of the new TODO item"),
    currentState: z
      .object({
        title: z.string(),
        description: z.string().optional(),
        items: z.array(
          z.object({
            id: z.string(),
            text: z.string(),
            completed: z.boolean(),
            createdAt: z.string(),
            completedAt: z.string().optional().nullable(),
          }),
        ),
        createdAt: z.string(),
      })
      .describe("Current state of the TODO list from the most recent tool call"),
  }),
  execute: async ({
    listId,
    text,
    currentState,
  }: {
    listId: string
    text: string
    currentState: {
      title: string
      description?: string
      items: Array<{
        id: string
        text: string
        completed: boolean
        createdAt: string
        completedAt?: string | null
      }>
      createdAt: string
    }
  }) => {
    const timestamp = new Date().toISOString()

    const newItem = {
      id: `${listId}-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      completed: false,
      createdAt: timestamp,
      completedAt: null,
    }

    // Create updated items array with new item
    const updatedItems = [...currentState.items, newItem]

    const completedCount = updatedItems.filter((i) => i.completed).length
    const totalCount = updatedItems.length

    // Return complete updated state
    return {
      success: true,
      listId,
      title: currentState.title,
      description: currentState.description,
      itemId: newItem.id,
      text: newItem.text,
      itemCount: updatedItems.length,
      items: updatedItems,
      progress: {
        completed: completedCount,
        total: totalCount,
        percentage: Math.round((completedCount / totalCount) * 100),
      },
      createdAt: currentState.createdAt,
      updatedAt: timestamp,
      message: `Added new item: ${text}`,
    }
  },
}

// Export all tools as a single object
export const chatTools = {
  sequentialThinking: sequentialThinkingTool,
  createTodoList: createTodoListTool,
  setTodoState: setTodoStateTool,
  addTodoItem: addTodoItemTool,
}
