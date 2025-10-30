import { LucideIcon } from "lucide-react"

interface ReliabilityCardProps {
  icon: LucideIcon
  title: string
  description: string
  featuresList: string[]
}

export function ReliabilityCard({ icon: Icon, title, description, featuresList }: ReliabilityCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-zinc-900 border-2 border-gray-800 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-400">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl group-hover:opacity-100 transition-opacity"></div>
      
      <div className="relative">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50 shadow-blue-400/30 mb-4">
          <Icon className="h-6 w-6 text-white" />
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-3">
          {title}
        </h3>
        
        <p className="text-base text-gray-400 mb-4 opacity-70">
          {description}
        </p>
        
        <ul className="space-y-2">
          {featuresList.map((feature, index) => (
            <li key={index} className="text-sm text-gray-400 flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

