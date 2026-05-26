'use client';

import React, { useState } from 'react';
import { mockClients } from '@/lib/mock-data';
import { Client } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Mail, Phone, Calendar, UserPlus } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Clients Directory</h2>
          <p className="text-sm text-neutral-500 mt-1">Manage veterinary clients, contact information, and registration history.</p>
        </div>
        <Button className="bg-neutral-900 hover:bg-neutral-800 text-white gap-2 h-10 px-4 self-start sm:self-auto rounded-lg">
          <UserPlus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Directory Table Card */}
      <Card className="border border-neutral-100 bg-white shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="text-xs text-neutral-400 font-medium self-end sm:self-center">
              Showing {filteredClients.length} of {clients.length} clients
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="hover:bg-transparent border-neutral-100">
                  <TableHead className="w-[200px] text-xs font-semibold text-neutral-500 h-10 px-6">Client Name</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Email Address</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Phone Number</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Registered Pets</TableHead>
                  <TableHead className="text-xs font-semibold text-neutral-500 h-10">Join Date</TableHead>
                  <TableHead className="w-[100px] text-xs font-semibold text-neutral-500 h-10 pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-sm text-neutral-400">
                      No clients found matching "{searchQuery}".
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-neutral-50/50 transition-colors border-neutral-100">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 font-semibold text-sm text-neutral-600 border border-neutral-200/50">
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 leading-none">{client.name}</p>
                            <p className="text-xs text-neutral-400 mt-1 leading-none">ID: {client.id.toUpperCase()}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Mail className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Phone className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="text-sm">{client.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-xs font-bold px-1.5">
                          {client.petsCount} {client.petsCount === 1 ? 'pet' : 'pets'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="text-sm">
                            {new Date(client.joinedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right">
                        <Button variant="ghost" size="sm" className="text-xs text-neutral-600 hover:text-neutral-900 rounded-lg">
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
