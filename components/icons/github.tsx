import { siGithub } from "simple-icons"
import { IconProps } from "./icon-props"

export default function GitHub({ className = "w-4 h-4 mr-2" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d={siGithub.path} />
    </svg>
  )
}
