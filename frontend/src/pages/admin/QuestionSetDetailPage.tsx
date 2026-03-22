import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { api } from '@/services/api'
import type { QuestionSetDetail } from '@/types/questions'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft, Printer, ChevronDown, ChevronUp } from 'lucide-react'

const difficultyLabels: Record<string, string> = {
  simple: 'Simple',
  moderate: 'Moderate',
  tough: 'Tough',
}

const difficultyColors: Record<string, string> = {
  simple: 'text-green-600',
  moderate: 'text-yellow-600',
  tough: 'text-red-600',
}

export function QuestionSetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<QuestionSetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!id) return
    api.get<QuestionSetDetail>(`/questions/${id}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const toggleAnswer = (num: number) => {
    setExpandedAnswers((prev) => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num)
      else next.add(num)
      return next
    })
  }

  const toggleAll = () => {
    if (!data) return
    if (expandedAnswers.size === data.questions.length) {
      setExpandedAnswers(new Set())
    } else {
      setExpandedAnswers(new Set(data.questions.map((q) => q.number)))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!data) return <p className="text-muted-foreground">Question set not found.</p>

  const questions = typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/questions">
            <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{data.jd_title}</h1>
            <p className="text-muted-foreground">
              <span className={`font-medium ${difficultyColors[data.difficulty]}`}>
                {difficultyLabels[data.difficulty]}
              </span>
              {' '}&middot; {data.question_count} questions
              {data.candidate_name && <> &middot; For: {data.candidate_name}</>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {expandedAnswers.size === questions.length ? 'Hide All Answers' : 'Show All Answers'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q: QuestionSetDetail['questions'][0]) => (
          <Card key={q.number}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">
                  <span className="mr-2 text-primary">Q{q.number}.</span>
                  {q.question}
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">Topic: {q.topic}</p>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => toggleAnswer(q.number)}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                {expandedAnswers.has(q.number) ? (
                  <><ChevronUp className="h-4 w-4" /> Hide Expected Answer</>
                ) : (
                  <><ChevronDown className="h-4 w-4" /> Show Expected Answer</>
                )}
              </button>
              {expandedAnswers.has(q.number) && (
                <div className="mt-3 space-y-3">
                  <div className="rounded-md bg-muted p-4 text-sm text-foreground whitespace-pre-wrap">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">Expected Answer</p>
                    {q.expectedAnswer}
                  </div>
                  {q.followUp && (
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                      <p className="mb-1 text-xs font-semibold text-primary uppercase">Suggested Follow-up</p>
                      {q.followUp}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </PageTransition>
  )
}
