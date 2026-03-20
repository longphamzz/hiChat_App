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


const signinSchema = z.object({
  username: z.string().min(2, "Tên đăng nhập phải có ít nhất 2 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự")
});


type SignInFormValues = z.infer<typeof signinSchema>;

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">){
  const {signIn} = useAuthStore();
  const navigate = useNavigate(); 
     const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormValues>({
        resolver: zodResolver(signinSchema)
      });
      const onSubmit = async (data: SignInFormValues) => {
    const {username, password} = data;
    await signIn(username,password);
    navigate('/');
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
                <h1 className="text-2xl font-bold">Chào mừng bạn quay lại</h1>
                <p className="text-sm text-muted-foreground text-balance">
                  Hãy đăng nhập để bắt đầu cuộc trò chuyện.
                </p>
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
                Đăng nhập
              </Button>

              <div className="text-center text-sm">
                Bạn chưa đã có tài khoản?{" "}
                <a href="/signup" className="underline underline-offset-4">
                  Đăng ký
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
