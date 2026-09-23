<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class VerifyCodeController extends Controller
{
    public function create(Request $request): View|RedirectResponse
    {
        if (! $this->pendingUser($request)) {
            return redirect()->route('register.create');
        }

        return view('auth.verify-code');
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $this->pendingUser($request);

        if (! $user) {
            return redirect()->route('register.create');
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'digits:6'],
        ]);

        $expired = $user->email_activation_code_expires_at === null
            || $user->email_activation_code_expires_at->isPast();

        if ($expired || $user->email_activation_code !== $validated['code']) {
            return back()->withErrors([
                'code' => $expired ? 'That code has expired. Please request a new one.' : 'That code is incorrect.',
            ]);
        }

        $user->forceFill([
            'email_verified_at' => now(),
            'email_activation_code' => null,
            'email_activation_code_expires_at' => null,
        ])->save();

        $request->session()->forget('pending_verification_user_id');
        $request->session()->regenerate();

        Auth::login($user);

        return redirect()->route('dashboard');
    }

    protected function pendingUser(Request $request): ?User
    {
        $userId = $request->session()->get('pending_verification_user_id');

        if (! $userId) {
            return null;
        }

        return User::whereKey($userId)->whereNull('email_verified_at')->first();
    }
}
