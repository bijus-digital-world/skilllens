import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { useToast } from '@/components/ui/Toast'
import { adminService } from '@/services/admin'
import type { JobDescription, CandidateCV, Candidate } from '@/types/models'
import type { EvaluationProfile } from '@/types/profile'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { CalendarDays } from 'lucide-react'

export function ScheduleInterviewPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jds, setJds] = useState<JobDescription[]>([])
  const [cvs, setCvs] = useState<CandidateCV[]>([])
  const [profiles, setProfiles] = useState<EvaluationProfile[]>([])
  const [filteredCvs, setFilteredCvs] = useState<CandidateCV[]>([])

  const [candidateId, setCandidateId] = useState('')
  const [jdId, setJdId] = useState('')
  const [cvId, setCvId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [interviewerGender, setInterviewerGender] = useState('')
  const [duration, setDuration] = useState('30')
  const [scheduledStart, setScheduledStart] = useState('')
  const [persona, setPersona] = useState('friendly')
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(true)
  const [initialDifficulty, setInitialDifficulty] = useState('moderate')
  const [isPractice, setIsPractice] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [c, j, v, p] = await Promise.all([
          adminService.getCandidates(),
          adminService.getJobDescriptions({ limit: 100 }),
          adminService.getCVs({ limit: 100 }),
          api.get<EvaluationProfile[]>('/profiles'),
        ])
        setCandidates(c)
        setJds(j.data)
        setCvs(v.data)
        setProfiles(p)
      } catch {
        // ignore
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (candidateId) {
      setFilteredCvs(cvs.filter((cv) => cv.candidate_id === candidateId))
      setCvId('')
    } else {
      setFilteredCvs([])
    }
  }, [candidateId, cvs])

  // Auto-suggest configuration when JD and CV are both selected
  useEffect(() => {
    if (!jdId || !cvId) return
    api.post<{ profileId: string; duration: number }>('/suggest/interview-config', { jdId, cvId })
      .then((suggestion) => {
        if (suggestion.profileId && !profileId) setProfileId(suggestion.profileId)
        if (suggestion.duration && duration === '30') setDuration(String(suggestion.duration))
        toast.info('Configuration suggested based on JD and CV analysis')
      })
      .catch(() => {})
  }, [jdId, cvId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!candidateId || !jdId || !cvId || !scheduledStart) {
      setError('All fields are required')
      return
    }

    setLoading(true)
    setError('')
    try {
      await adminService.createInterview({
        candidateId,
        jdId,
        cvId,
        durationMinutes: parseInt(duration, 10),
        scheduledStart: new Date(scheduledStart).toISOString(),
        profileId: profileId || undefined,
        interviewerGender: interviewerGender || undefined,
        persona,
        adaptiveDifficulty,
        initialDifficulty,
        isPractice,
      })
      toast.success('Interview scheduled')
      navigate('/admin/interviews')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule interview')
    } finally {
      setLoading(false)
    }
  }

  const ready = candidates.length > 0 && jds.length > 0

  return (
    <PageTransition>
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Schedule Interview</h1>
        <p className="text-muted-foreground">Set up a new mock interview for a candidate</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Interview Details
          </CardTitle>
          <CardDescription>
            {ready ? 'Fill in the details to schedule an interview' : 'You need at least one candidate and one job description to schedule an interview.'}
          </CardDescription>
        </CardHeader>
        {ready && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              <Select id="candidate" label="Candidate" value={candidateId} onChange={(e) => setCandidateId(e.target.value)} required>
                <option value="">Select a candidate</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </Select>

              <Select id="jd" label="Job Description" value={jdId} onChange={(e) => setJdId(e.target.value)} required>
                <option value="">Select a job description</option>
                {jds.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </Select>

              <Select id="cv" label="Candidate CV" value={cvId} onChange={(e) => setCvId(e.target.value)} required disabled={!candidateId}>
                <option value="">{candidateId ? (filteredCvs.length ? 'Select a CV' : 'No CVs for this candidate') : 'Select a candidate first'}</option>
                {filteredCvs.map((cv) => (
                  <option key={cv.id} value={cv.id}>{cv.file_name}</option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="scheduledStart"
                  label="Interview Date & Time"
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  required
                />
                <Select id="duration" label="Duration (minutes)" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </Select>
              </div>

              <Select id="interviewerGender" label="Interviewer" value={interviewerGender} onChange={(e) => setInterviewerGender(e.target.value)}>
                <option value="">Random (any gender)</option>
                <option value="male">Male interviewer</option>
                <option value="female">Female interviewer</option>
              </Select>

              <Select id="profile" label="Evaluation Profile" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                <option value="">Default evaluation (no profile)</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.strictness} scoring, pass at {p.pass_threshold}/10
                  </option>
                ))}
              </Select>

              <Select id="persona" label="Interviewer Style" value={persona} onChange={(e) => setPersona(e.target.value)}>
                <option value="friendly">Friendly — warm, encouraging, puts candidate at ease</option>
                <option value="tough">Tough — direct, expects precise answers, pointed follow-ups</option>
                <option value="rapid_fire">Rapid Fire — fast-paced, more questions, minimal reactions</option>
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Select id="initialDifficulty" label={adaptiveDifficulty ? 'Starting Difficulty' : 'Fixed Difficulty'} value={initialDifficulty} onChange={(e) => setInitialDifficulty(e.target.value)}>
                  <option value="simple">Simple — basics and fundamentals</option>
                  <option value="moderate">Moderate — scenario-based</option>
                  <option value="tough">Tough — deep dives and trade-offs</option>
                </Select>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm cursor-pointer hover:bg-accent/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={adaptiveDifficulty}
                      onChange={(e) => setAdaptiveDifficulty(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 accent-primary"
                    />
                    <span className="text-foreground">Adaptive difficulty</span>
                  </label>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {adaptiveDifficulty ? 'AI adjusts difficulty based on responses' : 'All questions stay at the chosen level'}
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="checkbox"
                  checked={isPractice}
                  onChange={(e) => setIsPractice(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-primary"
                />
                <div>
                  <span className="text-foreground">Practice interview</span>
                  <p className="text-[11px] text-muted-foreground">Candidate gets feedback tips. Does not count in stats or comparisons.</p>
                </div>
              </label>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Scheduling...' : isPractice ? 'Schedule Practice' : 'Schedule Interview'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
    </PageTransition>
  )
}
