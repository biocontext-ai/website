"use client"

import DeleteBlogPostButton from "@/components/blog/delete-blog-post-button"
import Markdown from "@/components/markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { hasBlogPostProperty, hasErrorProperty } from "@/types/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, PlusCircle, Save, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const blogFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  excerpt: z.string().max(500, "Excerpt must be 500 characters or less").optional(),
  content: z.string().min(1, "Content is required"),
  published: z.boolean(),
  metaTitle: z.string().max(200, "Meta title must be 200 characters or less").optional(),
  metaDescription: z.string().max(500, "Meta description must be 500 characters or less").optional(),
  keywords: z.array(z.string()),
})

type BlogFormValues = z.infer<typeof blogFormSchema>

interface BlogFormProps {
  initialData?: Partial<BlogFormValues> & { id?: string }
  isEditing?: boolean
}

export default function BlogForm({ initialData, isEditing = false }: BlogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [keywordInput, setKeywordInput] = useState("")
  const [activeTab, setActiveTab] = useState("content")
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      excerpt: initialData?.excerpt || undefined,
      content: initialData?.content || "",
      published: initialData?.published || false,
      metaTitle: initialData?.metaTitle || undefined,
      metaDescription: initialData?.metaDescription || undefined,
      keywords: initialData?.keywords || [],
    },
  })

  const watchedKeywords = form.watch("keywords")
  const watchedContent = form.watch("content")
  const watchedPublished = form.watch("published")

  async function onSubmit(values: BlogFormValues) {
    setIsSubmitting(true)
    try {
      const url = isEditing ? `/api/blog/${initialData?.id}` : "/api/blog"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = hasErrorProperty(errorData)
          ? errorData.error
          : `Failed to ${isEditing ? "update" : "create"} blog post`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      toast({
        title: isEditing ? "Blog post updated!" : "Blog post created!",
        description: isEditing
          ? "Your blog post has been updated successfully."
          : "Your blog post has been created successfully.",
      })

      // Redirect to the blog post or blog list
      if (hasBlogPostProperty(data) && data.blogPost?.slug) {
        router.push(`/blog/${data.blogPost.slug}`)
      } else {
        router.push("/blog")
      }
      router.refresh()
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} blog post:`, error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditing ? "update" : "create"} blog post. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addKeyword = () => {
    const keyword = keywordInput.trim()
    if (keyword && !watchedKeywords.includes(keyword)) {
      form.setValue("keywords", [...watchedKeywords, keyword])
      setKeywordInput("")
    }
  }

  const removeKeyword = (keywordToRemove: string) => {
    form.setValue(
      "keywords",
      watchedKeywords.filter((keyword) => keyword !== keywordToRemove),
    )
  }

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Blog Post" : "Create New Blog Post"}</h1>
        <p className="text-muted-foreground mt-2">
          {isEditing ? "Update your blog post content and settings." : "Create and publish a new blog post."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Content
                  </CardTitle>
                  <CardDescription>Write your blog post content using Markdown syntax</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter blog post title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of the blog post..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A short summary that appears in blog listings and search results
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="content">Write</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                          </TabsList>
                          <TabsContent value="content" className="mt-4">
                            <FormControl>
                              <Textarea
                                placeholder="Write your blog post content in Markdown..."
                                className="min-h-[400px] font-mono"
                                {...field}
                              />
                            </FormControl>
                          </TabsContent>
                          <TabsContent value="preview" className="mt-4">
                            <div className="min-h-[400px] border rounded-md p-4 prose prose-gray max-w-none dark:prose-invert">
                              {watchedContent ? (
                                <Markdown>{watchedContent}</Markdown>
                              ) : (
                                <p className="text-muted-foreground italic">Start writing to see the preview...</p>
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                        <FormDescription>
                          Use Markdown syntax for formatting. Supports headings, links, images, code blocks, and more.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publish Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Publish</CardTitle>
                  <CardDescription>Control the visibility of your blog post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Published</FormLabel>
                          <FormDescription>Make this post visible to all visitors</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {watchedPublished ? "Publish" : "Save Draft"}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Delete Button for Editing */}
                  {isEditing && initialData?.id && (
                    <div className="pt-4 border-t">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                        <p className="text-sm text-muted-foreground">
                          Once you delete a blog post, there is no going back. Please be certain.
                        </p>
                        <DeleteBlogPostButton
                          postId={initialData.id}
                          postTitle={initialData.title || "Untitled"}
                          size="sm"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle>Keywords</CardTitle>
                  <CardDescription>Add tags to help categorize your post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add keyword..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={handleKeywordKeyPress}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addKeyword}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>

                  {watchedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {watchedKeywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="gap-1">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO</CardTitle>
                  <CardDescription>Optimize your post for search engines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title</FormLabel>
                        <FormControl>
                          <Input placeholder="SEO title..." {...field} />
                        </FormControl>
                        <FormDescription>Leave empty to use the post title</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="SEO description..." className="resize-none" rows={3} {...field} />
                        </FormControl>
                        <FormDescription>Leave empty to use the excerpt</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
