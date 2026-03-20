import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "../ui/label"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuthStore } from "@/stores/useAuthStore"
import { useNavigate } from "react-router"

const signupSchema = z.object({
  firstname: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  lastname: z.string().min(2, "Họ phải có ít nhất 2 ký tự"),
  username: z.string().min(2, "Tên đăng nhập phải có ít nhất 2 ký tự"),
  email: z.email("Vui lòng nhập địa chỉ email hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự")
});

type SignUpFormValues = z.infer<typeof signupSchema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {signUp} = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpFormValues>({
    resolver: zodResolver(signupSchema)
  });
  const onSubmit = async (data: SignUpFormValues) => {
    const {firstname, lastname, username, email, password} = data;

    await signUp(username, password, email, firstname, lastname);

    navigate('/signin');
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* header - logo  */}
              <div className="flex flex-col items-center text-center gap-2">
                <a href="/" className="mx-auto block w-fit text-center ">
                  <img src="" alt="" />
                </a>
                <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
                <p className="text-sm text-muted-foreground text-balance">
                  Chào mừng bạn đến với ChatApp! Hãy tạo tài khoản để bắt đầu trò chuyện.
                </p>
              </div>

              {/* ho va ten */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="lastname" className="block text-sm">Họ</Label>
                  <Input type="text" id="lastname" placeholder="Pham" {...register("lastname")} />

                  {/* todo: error message  */}
                  {errors.lastname && (
                    <p className="text-destructive text-sm">
                      {errors.lastname.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="block text-sm">Tên</Label>
                  <Input type="text" id="firstname" placeholder="Long" {...register("firstname")} />
                  {/* todo: error message  */}
                  {errors.firstname && (
                    <p className="text-destructive text-sm">
                      {errors.firstname.message}
                    </p>
                  )}
                </div>
              </div>

              {/* username */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="username" className="block text-sm">Tên đăng nhập</Label>
                <Input type="text" id="username" placeholder="longdh" {...register("username")} />
                {/* todo: error message  */}
                {errors.username && (
                  <p className="text-destructive text-sm">
                    {errors.username.message}
                  </p>
                )}
              </div>
              {/* email */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="email" className="block text-sm">Email</Label>
                <Input type="email" id="email" placeholder="longdh@example.com" {...register("email")} />
                {/* todo: error message  */}
                {errors.email && (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>
              {/* password */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="password" className="block text-sm">Mật khẩu</Label>
                <Input type="password" id="password" placeholder="••••••••" {...register("password")} />
                {/* todo: error message  */}
                {errors.password && (
                  <p className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {/* nut dang ky  */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Đăng ký
              </Button>

              <div className="text-center text-sm">
                Bạn đã có tài khoản?{" "}
                <a href="/signin" className="underline underline-offset-4">
                  Đăng nhập
                </a>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="px-6 text-xs text-balance text-center *:[a]:underline *:[a]:underline-offset-4">
        Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a> và {" "}
        và <a href="#">Chính sách bảo mật</a>.
      </div>
    </div>
  )
}
