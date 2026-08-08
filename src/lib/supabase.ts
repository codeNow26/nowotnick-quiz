import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fmqiauqpcuytqnugitla.supabase.co";
const supabaseKey = "sb_publishable_Te2OOrJaSTAgBUPC1IQpzA_j-w6G15o";

export const supabase = createClient(supabaseUrl, supabaseKey);