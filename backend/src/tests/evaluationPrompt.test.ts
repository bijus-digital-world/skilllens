import { describe, it, expect } from 'vitest'
import { buildEvaluationPrompt } from '../services/evaluation'

describe('buildEvaluationPrompt', () => {
  const jd = 'Senior React Developer role'
  const cv = 'John Doe, 5 years experience'
  const transcript = 'ASSISTANT: Tell me about yourself.\n\nUSER: I have 5 years of React experience.'

  it('includes JD, CV, and transcript', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain(jd)
    expect(prompt).toContain(cv)
    expect(prompt).toContain(transcript)
  })

  it('uses default categories when none provided', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain('Technical Competency')
    expect(prompt).toContain('Problem Solving')
    expect(prompt).toContain('Communication')
    expect(prompt).toContain('Role Fit')
  })

  it('uses custom categories when provided', () => {
    const categories = [
      { name: 'React Mastery', weight: 60, description: 'Deep React knowledge' },
      { name: 'Testing', weight: 40, description: 'Testing practices' },
    ]
    const prompt = buildEvaluationPrompt(jd, cv, transcript, categories)
    expect(prompt).toContain('React Mastery')
    expect(prompt).toContain('Testing')
    expect(prompt).not.toContain('Role Fit')
  })

  it('uses moderate strictness by default', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain('Score fairly')
  })

  it('uses strict scoring when specified', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript, undefined, 'strict')
    expect(prompt).toContain('Score rigorously')
  })

  it('includes correct pass threshold', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript, undefined, undefined, 7.5)
    expect(prompt).toContain('7.5/10')
  })

  it('uses default pass threshold of 6', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain('6/10')
  })

  it('requests content and delivery scores', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain('contentScore')
    expect(prompt).toContain('deliveryScore')
    expect(prompt).toContain('Content and delivery are SEPARATE')
  })

  it('requests evidence-based scoring', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain('"evidence"')
    expect(prompt).toContain('SPECIFIC quote or paraphrase')
  })

  it('requests confidence level', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain('confidenceLevel')
    expect(prompt).toContain('confidenceReason')
  })

  it('requests follow-up areas', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain('followUpAreas')
    expect(prompt).toContain('follow-up interview')
  })

  it('tracks hints needed', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain('hintsNeeded')
  })

  it('uses mid-level seniority expectations by default', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain('Mid-level (3-5 years)')
  })

  it('uses junior seniority expectations when specified', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript, undefined, undefined, undefined, 'junior')
    expect(prompt).toContain('Junior (0-2 years)')
    expect(prompt).toContain('Do NOT penalize for lack of system design')
  })

  it('uses senior seniority expectations when specified', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript, undefined, undefined, undefined, 'senior')
    expect(prompt).toContain('Senior (5+ years)')
    expect(prompt).toContain('system-level thinking')
  })

  it('enforces the Google rule — single low score = No Hire', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain('contentScore of 1 on a critical category should result in "No Hire"')
  })

  it('prohibits Maybe recommendation', () => {
    const prompt = buildEvaluationPrompt(jd, cv, transcript)
    expect(prompt).toContain('Strong Hire')
    expect(prompt).toContain('No Hire')
    expect(prompt).toContain('DO NOT use "Maybe"')
  })
})
