<?php

namespace App\Mail;

use App\Models\MealPlan;
use App\Models\User;
use App\Services\WhatsApp\WhatsAppMessageFormatter;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class DietPlanMail extends Mailable
{
    use Queueable, SerializesModels;

    public Carbon $forDate;

    public string $copyableText;

    /**
     * @param  Collection<int, array<string, mixed>>  $groceryItems
     */
    public function __construct(
        public User $user,
        public MealPlan $day,
        public Collection $groceryItems,
    ) {
        $this->forDate = $day->week_start_date->copy()->addDays($day->day_index);
        $this->copyableText = WhatsAppMessageFormatter::dietAndGrocery($user, $day, $groceryItems);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your DietPlan ' . $this->forDate->format('M j, l') . ' from NutriPing',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.diet-plan');
    }
}
