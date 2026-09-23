<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class MobileNumberController extends Controller
{
    public function create(Request $request): View|RedirectResponse
    {
        if (! $request->user()->needsMobileNumber()) {
            return redirect()->route('dashboard');
        }

        return view('auth.mobile-number');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'mobile_number' => ['required', 'string', 'max:20', 'unique:users,mobile_number'],
        ]);

        $request->user()->forceFill($validated)->save();

        return redirect()->route('dashboard');
    }
}
