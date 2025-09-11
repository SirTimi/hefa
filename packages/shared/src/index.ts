export const APP_NAME = 'HEFA'
export type ID = string

import { z } from 'zod'
export const PhoneSchema = z.string().min(10).max(20)
