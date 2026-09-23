<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\ActivationCodeMail;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\View\View;

class RegisterController extends Controller
{
    public function create(): View
    {
        return view('auth.register');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'mobile_number' => ['required', 'string', 'max:20', 'unique:users,mobile_number'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'mobile_number' => $validated['mobile_number'],
            'password' => Hash::make($validated['password']),
        ]);

        $this->sendActivationCode($user);

        $request->session()->put('pending_verification_user_id', $user->id);

        return redirect()->route('verify-code.create');
    }

    public function resend(Request $request): RedirectResponse
    {
        $userId = $request->session()->get('pending_verification_user_id');
        $user = User::whereKey($userId)->whereNull('email_verified_at')->first();

        if (! $user) {
            return redirect()->route('register.create');
        }

        $this->sendActivationCode($user);

        return back()->with('status', 'A new activation code has been sent to your email.');
    }

    protected function sendActivationCode(User $user): void
    {
        $code = (string) random_int(100000, 999999);

        $user->forceFill([
            'email_activation_code' => $code,
            'email_activation_code_expires_at' => now()->addMinutes(15),
        ])->save();

        Mail::to($user->email)->send(new ActivationCodeMail($user->name, $code));
    }
}
