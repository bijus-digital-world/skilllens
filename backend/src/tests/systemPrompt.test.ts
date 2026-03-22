import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../services/interviewHandler'

describe('buildSystemPrompt', () => {
  const jd = 'We need a React developer with 3+ years experience.'
  const cv = 'John Doe, 4 years React experience.'

  it('includes JD and CV text', () => {
    const prompt = buildSystemPrompt(jd, cv, 30)
    expect(prompt).toContain(jd)
    expect(prompt).toContain(cv)
  })

  it('includes a randomly selected interviewer name when none provided', () => {
    const prompt = buildSystemPrompt(jd, cv, 30)
    // Should contain "You are <SomeName>." at the start
    expect(prompt).toMatch(/You are [A-Z][a-z]+ [A-Z][a-z]+/)
  })

  it('uses custom interviewer name', () => {
    const prompt = buildSystemPrompt(jd, cv, 30, undefined, 'Anita Patel')
    expect(prompt).toContain('Anita Patel')
    expect(prompt).not.toContain('Rahul Menon')
  })

  it('includes duration', () => {
    const prompt = buildSystemPrompt(jd, cv, 45)
    expect(prompt).toContain('45 minutes')
  })

  it('includes friendly persona by default', () => {
    const prompt = buildSystemPrompt(jd, cv, 30)
    expect(prompt).toContain('genuinely curious about people')
  })

  it('includes tough persona when specified', () => {
    const prompt = buildSystemPrompt(jd, cv, 30, undefined, undefined, { persona: 'tough' })
    expect(prompt).toContain('sharp, efficient, and direct')
  })

  it('includes rapid_fire persona when specified', () => {
    const prompt = buildSystemPrompt(jd, cv, 30, undefined, undefined, { persona: 'rapid_fire' })
    expect(prompt).toContain('energetic and fast-paced')
  })

  it('includes adaptive difficulty instructions by default', () => {
    const prompt = buildSystemPrompt(jd, cv, 30)
    expect(prompt).toContain('ADAPTIVE DIFFICULTY')
    expect(prompt).toContain('you MUST drop difficulty immediately')
  })

  it('uses fixed difficulty when adaptive is false', () => {
    const prompt = buildSystemPrompt(jd, cv, 30, undefined, undefined, { adaptiveDifficulty: false, initialDifficulty: 'simple' })
    expect(prompt).not.toContain('ADAPTIVE DIFFICULTY')
    expect(prompt).toContain('Keep ALL questions at a simple')
  })

  it('uses correct initial difficulty level', () => {
    const prompt = buildSystemPrompt(jd, cv, 30, undefined, undefined, { adaptiveDifficulty: true, initialDifficulty: 'tough' })
    expect(prompt).toContain('Start with challenging questions')
  })

  it('includes interview conversation flow guidance', () => {
    const prompt = buildSystemPrompt(jd, cv, 30)
    expect(prompt).toContain('CONVERSATION FLOWS')
    expect(prompt).toContain('STAY ON THE THREAD')
    expect(prompt).toContain('BRIDGE')
  })

  it('includes natural reactions and imperfections guidance', () => {
    const prompt = buildSystemPrompt(jd, cv, 30)
    expect(prompt).toContain('VARIED REACTIONS')
    expect(prompt).toContain('STRATEGIC IMPERFECTIONS')
    expect(prompt).toContain('never repeat the same one twice')
  })

  it('includes profile experience guidance', () => {
    const profile = {
      experience_level: 'senior',
      role_type: 'ic',
      domain: 'frontend',
      categories: [
        { name: 'React', weight: 50, description: 'React knowledge' },
        { name: 'CSS', weight: 50, description: 'Styling skills' },
      ],
      strictness: 'strict',
    }
    const prompt = buildSystemPrompt(jd, cv, 30, profile)
    expect(prompt).toContain('senior (5+ years)')
    expect(prompt).toContain('Talk to them like an equal')
    expect(prompt).toContain('React (50% weight)')
    expect(prompt).toContain('CSS (50% weight)')
    expect(prompt).toContain('Score rigorously')
    expect(prompt).toContain('frontend development')
  })

  it('includes tech lead role guidance', () => {
    const profile = {
      experience_level: 'lead',
      role_type: 'tech_lead',
      domain: 'backend',
      categories: [{ name: 'System Design', weight: 100, description: 'Design skills' }],
      strictness: 'moderate',
    }
    const prompt = buildSystemPrompt(jd, cv, 30, profile)
    expect(prompt).toContain('technical leadership and mentoring')
  })

  it('includes the human authenticity check', () => {
    const prompt = buildSystemPrompt(jd, cv, 30)
    expect(prompt).toContain('A real person')
    expect(prompt).toContain('FINAL CHECK')
    expect(prompt).toContain('Make it human')
  })
})
