"use client"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { hasErrorProperty } from "@/types/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { Flag } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "../ui/button"

const reportFormSchema = z.object({
  reason: z.string(),
  explanation: z.string().min(10),
})

type ReportFormSchemaType = z.infer<typeof reportFormSchema>

interface ReportButtonProps {
  identifier: string
}

const reportReasons = ["Abandoned server", "Copyright infringement", "Dangerous content", "Duplicate", "Other reason"]

export default function ReportButton(props: ReportButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const reportForm = useForm<ReportFormSchemaType>({
    resolver: zodResolver(reportFormSchema),
    mode: "onChange",
    defaultValues: {
      explanation: "",
      reason: reportReasons[0],
    },
  })

  async function onSubmit(values: ReportFormSchemaType) {
    try {
      const response = await fetch("/api/registry/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: props.identifier,
          ...values,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = hasErrorProperty(errorData)
          ? errorData.error
          : `Failed to submit report form for MCP server.`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      toast.success("MCP server is reported. Your report will be reviewed.")
      setIsOpen(false)
      reportForm.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit report form for MCP server.")
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reportForm.reset()
        }
        setIsOpen(open)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Flag />
          <span>Report</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Report MCP server</DialogTitle>
        <DialogDescription>
          To report a server <b>{props.identifier}</b>, please fill out the form below.
        </DialogDescription>

        <Form {...reportForm}>
          <form onSubmit={reportForm.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={reportForm.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue></SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reportReasons.map((e, eIndex) => (
                        <SelectItem key={eIndex} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            ></FormField>

            <FormField
              control={reportForm.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please write an explanation for the reviewers..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  {/* <FormDescription>
                                </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Submit report</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
