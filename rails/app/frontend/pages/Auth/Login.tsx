import { useForm } from '@inertiajs/react'
import { FormEvent } from 'react'

interface Props {
  errors: { base?: string }
}

export default function Login({ errors }: Props) {
  // Nested under `user` because Devise's SessionsController reads
  // credentials from params[:user][:email] / params[:user][:password].
  const { data, setData, post, processing } = useForm({
    user: { email: '', password: '' },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    post('/users/sign_in')
  }

  return (
    <form onSubmit={handleSubmit}>
      {errors.base && <p role="alert">{errors.base}</p>}
      <input
        type="email"
        value={data.user.email}
        onChange={(e) => setData('user', { ...data.user, email: e.target.value })}
      />
      <input
        type="password"
        value={data.user.password}
        onChange={(e) => setData('user', { ...data.user, password: e.target.value })}
      />
      <button type="submit" disabled={processing}>Log in</button>
    </form>
  )
}
