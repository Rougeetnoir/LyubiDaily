import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bzrtzhflysmhdfsvxsfx.supabase.co'
const supabaseAnonKey = 'sb_publishable_oj-Rz1O-orJyUy3CawDf5A_SAUY0lW-'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
