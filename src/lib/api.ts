import { CertificationProps } from "@/lib/types"
import { createClient } from "@/utils/supabase/server"

export const createCertification = async ({
  formData,
  userId,
  prevCertification,
}: {
  formData: Record<string, string>
  userId: string
  prevCertification: CertificationProps | null
}) => {
  const supabase = await createClient()

  // update
  if (prevCertification) {
    const { data, error } = await supabase
      .from("certifications_app")
      .update([{ answers: formData }])
      .eq("id", prevCertification.id)
      .select()

    console.log(data, error)

    return { data, error }
  } else {
    const { data, error } = await supabase
      .from("certifications_app")
      .insert([{ user_id: userId, answers: formData, level: 1 }])
      .select()

    return { data, error }
  }
}

export const getCertification = async ({
  level,
  userId,
}: {
  level: number
  userId: string
}) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("certifications_app")
    .select("*")
    .eq("user_id", userId)
    .eq("level", level)

  let certification = null
  if (data && data.length > 0) {
    certification = data[0]
  }

  return { data: certification, error }
}
